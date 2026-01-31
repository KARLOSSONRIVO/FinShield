"""
Search Router - Semantic search endpoints (placeholder for MCP).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/semantic")
async def semantic_search(query: str = "", top_k: int = 5):
    """
    Semantic search across invoices.
    TODO: Implement with sentence-transformers embeddings.
    """
    return {
        "ok": True,
        "message": "Semantic search endpoint - not yet implemented",
        "query": query,
        "top_k": top_k,
    }
