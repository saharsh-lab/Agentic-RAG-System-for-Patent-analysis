import re
from typing import List
from app.retrieval.semantic import RetrievedChunk


class BGEReranker:
    def __init__(self):
        # Heavy Cross-Encoder models can be optionally loaded; fallback scoring enforces patent-aware term boost
        self.use_transformer = False

    def rerank(
        self,
        query: str,
        candidates: List[RetrievedChunk],
        top_k: int = 5
    ) -> List[RetrievedChunk]:
        if not candidates:
            return []

        query_terms = set(re.findall(r'\b\w+\b', query.lower()))
        patent_identifiers = set(re.findall(r'\b(?:EP|US|WO)?\d+[A-Z\d]*\b', query, re.IGNORECASE))
        claim_numbers = set(re.findall(r'\bclaim\s*\d+\b', query, re.IGNORECASE))

        scored_candidates = []
        for candidate in candidates:
            text_lower = candidate.content.lower()
            text_terms = set(re.findall(r'\b\w+\b', text_lower))

            # 1. Base semantic score
            score = candidate.similarity_score * 0.5

            # 2. Term overlap (Jaccard / exact count)
            matching_terms = query_terms.intersection(text_terms)
            if query_terms:
                overlap_ratio = len(matching_terms) / len(query_terms)
                score += overlap_ratio * 0.3

            # 3. Patent Identifier Boost (e.g. publication numbers EP1234567, US10987654)
            for p_id in patent_identifiers:
                if p_id.lower() in text_lower:
                    score += 0.3

            # 4. Claim Number Boost (e.g. "claim 3")
            for c_num in claim_numbers:
                if c_num.lower() in text_lower:
                    score += 0.2

            updated_candidate = RetrievedChunk(
                chunk_id=candidate.chunk_id,
                document_id=candidate.document_id,
                filename=candidate.filename,
                content=candidate.content,
                page_number=candidate.page_number,
                section=candidate.section,
                chunk_index=candidate.chunk_index,
                similarity_score=round(score, 4)
            )
            scored_candidates.append(updated_candidate)

        # Sort descending by final reranked score
        scored_candidates.sort(key=lambda c: c.similarity_score, reverse=True)
        return scored_candidates[:top_k]


bge_reranker = BGEReranker()
