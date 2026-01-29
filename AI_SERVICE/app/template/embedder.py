from sentence_transformers import SentenceTransformer
from bson import ObjectId
from datetime import datetime
import io
import pandas as pd
from typing import Dict

from app.db.mongo import db

# Initialize the embedding model (lazy loading)
_model = None
MODEL_NAME = "all-MiniLM-L6-v2"  # Lightweight, fast, good quality


def get_model():
    """Lazy load the embedding model"""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def generate_embeddings_from_csv(org_id: str, csv_data: str) -> Dict[str, any]:
    """
    Generate embeddings from CSV data and store in MongoDB
    
    Args:
        org_id: Organization ID
        csv_data: CSV string data
    
    Returns:
        Dict with embedding metadata
    """
    # Parse CSV
    df = pd.read_csv(io.StringIO(csv_data))
    
    # Debug: Print CSV data
    print("\n" + "="*60)
    print("📄 CSV DATA RECEIVED:")
    print("="*60)
    print(df.to_string())
    print("="*60 + "\n")
    
    # Convert DataFrame to text representations for embedding
    # For line-based format, use the 'content' column directly
    texts = []
    
    if 'content' in df.columns:
        # Line-based format - use content directly
        for idx, row in df.iterrows():
            content = str(row['content']).strip()
            if content and content.lower() != 'nan':
                texts.append(content)
    else:
        # Fallback: concatenate all columns
        for idx, row in df.iterrows():
            row_text = " ".join([str(val) for val in row.values if pd.notna(val)])
            if row_text.strip():
                texts.append(row_text.strip())
    
    # Debug: Print texts being embedded
    print("\n" + "="*60)
    print("🔢 TEXTS BEING EMBEDDED:")
    print("="*60)
    for i, text in enumerate(texts):
        print(f"[{i}] {text}")
    print("="*60 + "\n")
    
    if not texts:
        raise ValueError("No valid data to embed from CSV")
    
    # Generate embeddings
    model = get_model()
    embeddings = model.encode(texts)
    
    # Convert numpy arrays to lists for MongoDB storage
    embedding_list = [emb.tolist() for emb in embeddings]
    
    # Store in MongoDB
    template_embeddings = db["template_embeddings"]
    
    embedding_doc = {
        "orgId": ObjectId(org_id),
        "modelName": MODEL_NAME,
        "embeddings": embedding_list,
        "texts": texts,
        "vectorDimension": len(embedding_list[0]) if embedding_list else 0,
        "vectorCount": len(embedding_list),
        "createdAt": datetime.utcnow(),
    }
    
    result = template_embeddings.insert_one(embedding_doc)
    
    return {
        "embeddingId": str(result.inserted_id),
        "vectorCount": len(embedding_list),
        "modelName": MODEL_NAME,
    }


def get_embeddings_by_org(org_id: str) -> Dict:
    """
    Retrieve embeddings for an organization
    
    Args:
        org_id: Organization ID
    
    Returns:
        Embedding document or None
    """
    template_embeddings = db["template_embeddings"]
    return template_embeddings.find_one({"orgId": ObjectId(org_id)})
