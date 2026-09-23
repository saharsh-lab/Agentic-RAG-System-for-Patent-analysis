from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID


class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    chunk_index: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    file_type: str
    file_size: int
    upload_timestamp: datetime
    chunk_count: int
    metadata: Optional[dict] = None
    summary: Optional[dict] = None
    claims_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []
    claims: Optional[list] = []
    sections: Optional[dict] = None


class ClaimAnalysisRequest(BaseModel):
    claim_number: int
    claim_text: str
    claim_type: Optional[str] = "INDEPENDENT"
    action: Optional[str] = "explain_simple"  # explain_simple, technical_components, supporting_patent_parts, or all


class ClaimAnalysisResponse(BaseModel):
    claim_number: int
    claim_type: str
    original_claim: str
    simplified_explanation: str
    technical_components: List[dict]
    supporting_disclosures: List[dict]
    evidence_citations: List[dict]
