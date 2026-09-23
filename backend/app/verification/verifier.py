import re
from typing import List, Dict, Any
from app.retrieval.normalization import UnifiedEvidence


class ClaimVerifier:
    """Verifies atomic claims against normalized multi-source evidence."""

    def verify_claims(
        self,
        claims: List[Dict[str, Any]],
        evidence_list: List[UnifiedEvidence]
    ) -> List[Dict[str, Any]]:
        verified_claims = []

        for claim in claims:
            c_text = claim["claim_text"]
            c_words = set(re.findall(r'\b\w{4,}\b', c_text.lower()))

            best_match_score = 0.0
            supporting_ids = []
            explanation = "No evidence found to support this claim."

            for ev in evidence_list:
                ev_content_lower = ev.content.lower()
                ev_words = set(re.findall(r'\b\w{4,}\b', ev_content_lower))

                if not c_words:
                    continue

                overlap = len(c_words.intersection(ev_words)) / len(c_words)

                # Check patent field mappings if evidence is PATENT type
                if ev.source_type == "PATENT":
                    meta = ev.metadata
                    if "legal_status" in meta and ("active" in c_text.lower() or "status" in c_text.lower()):
                        overlap += 0.4
                    if "filing_date" in meta and ("filed" in c_text.lower() or "filing" in c_text.lower()):
                        overlap += 0.4

                if overlap > best_match_score:
                    best_match_score = overlap
                    supporting_ids = [ev.id]
                    explanation = f"Supported by {ev.source_name} ('{ev.source_identifier}')."

            # Assign Status based on threshold
            if best_match_score >= 0.6:
                status = "SUPPORTED"
                confidence = min(1.0, round(best_match_score, 2))
            elif best_match_score >= 0.3:
                status = "PARTIALLY_SUPPORTED"
                confidence = round(best_match_score, 2)
            elif best_match_score > 0.1:
                status = "UNCERTAIN"
                confidence = round(best_match_score, 2)
                explanation = "Evidence is partial or inconclusive."
            else:
                status = "UNSUPPORTED"
                confidence = 0.0
                explanation = "Current evidence does not substantiate this claim."

            verified_claims.append({
                "claim_id": claim.get("claim_id"),
                "claim_text": c_text,
                "status": status,
                "confidence": confidence,
                "supporting_evidence_ids": supporting_ids,
                "explanation": explanation
            })

        return verified_claims


claim_verifier = ClaimVerifier()
