from typing import Dict, Any, List
import re


class EvidenceSufficiencyChecker:
    """Evaluates whether retrieved document evidence is sufficient to answer the user query."""

    def check_sufficiency(
        self,
        question: str,
        query_type: str,
        document_evidence: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not document_evidence:
            return {
                "sufficiency": "INSUFFICIENT",
                "missing_information": "No relevant evidence found in the uploaded document.",
                "recommended_sources": ["PATENT_API", "WEB"]
            }

        # Domain rules
        if query_type == "LEGAL_STATUS":
            return {
                "sufficiency": "INSUFFICIENT",
                "missing_information": "Current legal/status information requires live patent authority verification.",
                "recommended_sources": ["PATENT_API"]
            }

        if query_type == "PATENT_METADATA":
            all_text = " ".join([d.get("content", "") for d in document_evidence])
            q_low = question.lower()
            if any(w in q_low for w in ["published", "publication date", "filed", "filing date", "date"]):
                if re.search(r"(?:Date|Pub|Filed|Sep|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Oct|Nov|Dec|\d{4})", all_text, re.I):
                    return {"sufficiency": "SUFFICIENT", "missing_information": None, "recommended_sources": ["DOCUMENT"]}
            if any(w in q_low for w in ["inventor", "invented", "applicant", "assignee", "who"]):
                if re.search(r"(?:Inventor|Applicant|Assignee|Dr\.|Inc\.|Ltd|Corp)", all_text, re.I):
                    return {"sufficiency": "SUFFICIENT", "missing_information": None, "recommended_sources": ["DOCUMENT"]}

        if query_type in ["PATENT_RESEARCH", "CURRENT_TECHNOLOGY_RESEARCH", "MULTI_SOURCE_COMPARISON"]:
            return {
                "sufficiency": "INSUFFICIENT",
                "missing_information": "External research required for external patent family, citations, or market developments.",
                "recommended_sources": ["PATENT_API", "WEB"] if query_type != "PATENT_RESEARCH" else ["PATENT_API"]
            }

        return {
            "sufficiency": "SUFFICIENT",
            "missing_information": None,
            "recommended_sources": ["DOCUMENT"]
        }


sufficiency_checker = EvidenceSufficiencyChecker()
