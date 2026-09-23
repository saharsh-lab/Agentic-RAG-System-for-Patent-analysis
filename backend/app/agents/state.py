from typing import List, Optional, Dict, Any, TypedDict
from uuid import UUID


class AgentState(TypedDict):
    question: str
    document_id: Optional[UUID]
    query_type: str  # DOCUMENT_ANALYSIS, CLAIM_ANALYSIS, LEGAL_STATUS, PATENT_RESEARCH, CURRENT_TECHNOLOGY_RESEARCH, MULTI_SOURCE_COMPARISON
    extracted_entities: List[str]
    document_evidence: List[Dict[str, Any]]
    patent_evidence: List[Dict[str, Any]]
    web_evidence: List[Dict[str, Any]]
    evidence_sufficiency: str  # SUFFICIENT, INSUFFICIENT, UNCERTAIN
    missing_information: Optional[str]
    selected_sources: List[str]  # DOCUMENT, PATENT_API, WEB
    generated_answer: Optional[str]
    extracted_claims: List[Dict[str, Any]]
    claim_verifications: List[Dict[str, Any]]
    research_trail: List[str]
    iteration_count: int
    is_complete: bool
