from pydantic import BaseModel
from typing import Optional, List


class ConvertResponse(BaseModel):
    """Response for template to CSV conversion"""
    csv: str
    rowCount: int
    columnCount: int
    warnings: Optional[List[str]] = []


class EmbedRequest(BaseModel):
    """Request for embedding generation"""
    orgId: str
    csvData: str


class EmbedResponse(BaseModel):
    """Response for embedding generation"""
    embeddingId: str
    vectorCount: int
    modelName: str
