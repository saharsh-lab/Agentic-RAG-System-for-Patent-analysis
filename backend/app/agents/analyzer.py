import re
from typing import List, Dict, Any


class QueryAnalyzer:
    """Analyzes user patent questions to classify intent and extract target entities."""

    def analyze(self, question: str) -> Dict[str, Any]:
        q_lower = question.lower()

        # Extract patent identifiers (EP1234567, US10987654, WO2023123456)
        patent_ids = re.findall(r'\b(?:EP|US|WO)?\d{6,10}[A-Z\d]*\b', question, re.IGNORECASE)
        claim_refs = re.findall(r'\bclaim\s*\d+\b', question, re.IGNORECASE)

        # Priority 1: Multi-source comparison
        if any(w in q_lower for w in ["compare", "versus", "vs", "comparison"]):
            query_type = "MULTI_SOURCE_COMPARISON"
            expected_sources = ["DOCUMENT", "PATENT_API", "WEB"]
        # Priority 2: Legal Status
        elif any(w in q_lower for w in ["active", "legal status", "expired", "granted", "lapsed", "status of"]):
            query_type = "LEGAL_STATUS"
            expected_sources = ["DOCUMENT", "PATENT_API"]
        # Priority 3: Patent Bibliographic Metadata
        elif any(w in q_lower for w in [
            "published", "publication date", "filing date", "filed", "inventor",
            "applicant", "assignee", "patent number", "when was", "who invented",
            "who is the applicant", "what date"
        ]):
            query_type = "PATENT_METADATA"
            expected_sources = ["DOCUMENT", "PATENT_API"]
        # Priority 4: Patent Research
        elif any(w in q_lower for w in ["similar patent", "prior art", "published after", "other patents", "patent family"]):
            query_type = "PATENT_RESEARCH"
            expected_sources = ["DOCUMENT", "PATENT_API"]
        # Priority 5: Current Technology
        elif any(w in q_lower for w in ["latest", "recent developments", "commercial", "market", "industry"]):
            query_type = "CURRENT_TECHNOLOGY_RESEARCH"
            expected_sources = ["DOCUMENT", "WEB"]
        # Priority 6: Claim Analysis
        elif claim_refs or "claim" in q_lower:
            query_type = "CLAIM_ANALYSIS"
            expected_sources = ["DOCUMENT"]
        else:
            query_type = "DOCUMENT_ANALYSIS"
            expected_sources = ["DOCUMENT"]

        entities = list(set(patent_ids + claim_refs))

        return {
            "query_type": query_type,
            "extracted_entities": entities,
            "expected_sources": expected_sources
        }


query_analyzer = QueryAnalyzer()
