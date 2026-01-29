import tempfile
import os
from fastapi import UploadFile

from app.template.converter import convert_file_to_csv
from app.template.embedder import generate_embeddings_from_csv


async def convert_template(file: UploadFile) -> dict:
    """
    Convert uploaded template file to CSV
    
    Args:
        file: Uploaded file (PDF or DOCX)
    
    Returns:
        Dict with CSV data and metadata
    """
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Convert to CSV
        result = convert_file_to_csv(tmp_path, file.filename)
        return result
    finally:
        # Cleanup temp file
        try:
            os.remove(tmp_path)
        except:
            pass


async def create_embeddings(org_id: str, csv_data: str) -> dict:
    """
    Generate and store embeddings from CSV data
    
    Args:
        org_id: Organization ID
        csv_data: CSV string data
    
    Returns:
        Dict with embedding metadata
    """
    result = generate_embeddings_from_csv(org_id, csv_data)
    return result
