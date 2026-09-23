from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.chat import ChatQueryResponse


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    document_id: Optional[UUID] = None


class ConversationSummary(BaseModel):
    id: UUID
    title: str
    document_id: Optional[UUID] = None
    document_name: Optional[str] = None
    query_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageItem(BaseModel):
    query_id: UUID
    question: str
    query_type: Optional[str] = None
    created_at: datetime
    response: ChatQueryResponse


class ConversationDetail(BaseModel):
    id: UUID
    title: str
    document_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageItem] = []

    class Config:
        from_attributes = True


class FlaggedClaim(BaseModel):
    claim_id: UUID
    claim_text: str
    status: str
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    question: str
    answer_text: str
    created_at: datetime


class HallucinationAnalyticsResponse(BaseModel):
    total_claims: int
    supported_count: int
    partially_supported_count: int
    unsupported_count: int
    support_rate: float
    hallucination_rate: float
    grounding_score: float
    flagged_claims: List[FlaggedClaim] = []
