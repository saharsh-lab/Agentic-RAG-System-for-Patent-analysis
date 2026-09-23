from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


class PatentModelSchema(BaseModel):
    publication_number: str
    application_number: Optional[str] = None
    title: Optional[str] = None
    abstract: Optional[str] = None
    claims: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = None
    inventors: Optional[List[str]] = Field(default_factory=list)
    applicants: Optional[List[str]] = Field(default_factory=list)
    filing_date: Optional[str] = None
    publication_date: Optional[str] = None
    jurisdictions: Optional[List[str]] = Field(default_factory=list)
    cpc_codes: Optional[List[str]] = Field(default_factory=list)
    ipc_codes: Optional[List[str]] = Field(default_factory=list)
    legal_status: Optional[str] = "UNKNOWN"
    citations: Optional[List[str]] = Field(default_factory=list)
    family_members: Optional[List[str]] = Field(default_factory=list)
    source: str = "EPO"
    source_url: Optional[str] = None
    retrieved_at: Optional[datetime] = None


class PatentSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[PatentModelSchema]
