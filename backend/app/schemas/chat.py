from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ChatQueryRequest(BaseModel):
    question: str
    document_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    top_k: int = 5
    use_agent: bool = True



class SourceCitation(BaseModel):
    chunk_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    filename: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    content: str
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)


class ClaimVerificationResponse(BaseModel):
    claim_id: Optional[str] = None
    claim_text: str
    status: str  # SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED, UNCERTAIN
    confidence: float
    explanation: Optional[str] = None
    supporting_evidence_ids: List[str] = []


class ChatQueryResponse(BaseModel):
    query_id: UUID
    answer_id: UUID
    question: str
    answer: str
    query_type: Optional[str] = "DOCUMENT_ANALYSIS"
    evidence_sufficiency: Optional[str] = "SUFFICIENT"
    selected_sources: List[str] = ["DOCUMENT"]
    iteration_count: int = 1
    research_trail: List[str] = []
    citations: List[SourceCitation] = []
    claim_verifications: List[ClaimVerificationResponse] = []
    created_at: datetime
