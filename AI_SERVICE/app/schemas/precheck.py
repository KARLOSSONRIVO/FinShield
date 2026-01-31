"""
Precheck Schemas - Request/Response models for precheck endpoint.
"""
from pydantic import BaseModel
from typing import List, Optional


class PreCheckResponse(BaseModel):
    processable: bool
    reason: Optional[str] = None
    warnings: List[str] = []
    extractedText: Optional[str] = None
