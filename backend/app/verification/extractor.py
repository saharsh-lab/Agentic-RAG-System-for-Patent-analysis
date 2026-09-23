import re
from typing import List, Dict, Any


class ClaimExtractor:
    """Extracts atomic factual statements from generated RAG answers."""

    def extract_claims(self, answer_text: str) -> List[Dict[str, Any]]:
        if not answer_text or len(answer_text.strip()) == 0:
            return []

        # Remove inline citation tags like [Document: x, Page: y] for clean claim extraction
        clean_text = re.sub(r'\[Document:[^\]]+\]', '', answer_text)
        clean_text = re.sub(r'\[EPO:[^\]]+\]', '', clean_text)
        clean_text = re.sub(r'\[Web:[^\]]+\]', '', clean_text)

        # Split into sentences
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 15]

        claims = []
        for idx, sentence in enumerate(sentences, start=1):
            claims.append({
                "claim_id": f"claim_{idx}",
                "claim_text": sentence,
                "status": "UNVERIFIED"
            })

        return claims


claim_extractor = ClaimExtractor()
