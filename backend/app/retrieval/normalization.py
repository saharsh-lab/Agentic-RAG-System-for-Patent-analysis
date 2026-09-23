import uuid
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class UnifiedEvidence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_type: str  # DOCUMENT, PATENT, WEB
    source_name: str
    source_identifier: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source_url: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    relevance_score: float = 1.0


class EvidenceNormalizer:
    @staticmethod
    def normalize_document_chunk(chunk: Any) -> UnifiedEvidence:
        page_str = f"Page {chunk.page_number}" if getattr(chunk, "page_number", None) else "Page N/A"
        sec_str = getattr(chunk, "section", None) or "General"
        return UnifiedEvidence(
            source_type="DOCUMENT",
            source_name=f"Document: {chunk.filename}",
            source_identifier=f"{chunk.filename}#{page_str}",
            content=chunk.content,
            metadata={
                "document_id": str(chunk.document_id),
                "filename": chunk.filename,
                "page_number": chunk.page_number,
                "section": sec_str,
                "chunk_index": chunk.chunk_index
            },
            source_url=None,
            relevance_score=getattr(chunk, "similarity_score", 1.0)
        )

    @staticmethod
    def normalize_patent(patent: Any) -> UnifiedEvidence:
        content_text = f"Title: {patent.title}\nAbstract: {patent.abstract}\nLegal Status: {patent.legal_status}"
        if patent.claims:
            content_text += f"\nClaims: {' '.join(patent.claims[:2])}"
        return UnifiedEvidence(
            source_type="PATENT",
            source_name=f"EPO Patent: {patent.publication_number}",
            source_identifier=patent.publication_number,
            content=content_text,
            metadata={
                "publication_number": patent.publication_number,
                "application_number": patent.application_number,
                "legal_status": patent.legal_status,
                "filing_date": patent.filing_date,
                "publication_date": patent.publication_date,
                "ipc_codes": patent.ipc_codes
            },
            source_url=patent.source_url,
            relevance_score=1.0
        )

    @staticmethod
    def normalize_web_result(web_item: Dict[str, Any]) -> UnifiedEvidence:
        return UnifiedEvidence(
            source_type="WEB",
            source_name=f"Web: {web_item.get('domain', 'Web')}",
            source_identifier=web_item.get("url", "https://web.com"),
            content=web_item.get("content", ""),
            metadata={
                "title": web_item.get("title", ""),
                "domain": web_item.get("domain", "")
            },
            source_url=web_item.get("url"),
            relevance_score=0.8
        )

    @classmethod
    def deduplicate(cls, evidence_items: List[UnifiedEvidence]) -> List[UnifiedEvidence]:
        seen_hashes = set()
        deduped = []

        for item in evidence_items:
            # Create content fingerprint
            clean_content = item.content.strip().lower()
            h = hashlib.sha256(clean_content.encode("utf-8")).hexdigest()

            if h not in seen_hashes:
                seen_hashes.add(h)
                deduped.append(item)

        return deduped


evidence_normalizer = EvidenceNormalizer()
