import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.retrieval.fusion import hybrid_retriever

logger = logging.getLogger(__name__)


class ClaimAnalyzerService:
    """Provides targeted plain-English explanations, component breakdowns, and supporting evidence citations for patent claims."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=settings.OPENAI_API_KEY or "sk-placeholder-key-for-init",
            temperature=0.0
        )

    async def analyze_claim(
        self,
        claim_number: int,
        claim_text: str,
        claim_type: str,
        document_id: str,
        action: str,  # "explain_simple", "technical_components", "supporting_patent_parts", or "all"
        db: AsyncSession
    ) -> Dict[str, Any]:
        # 1. Retrieve relevant supporting document chunks to ground the claim in exact pages/sections
        query_text = f"Claim {claim_number} technical support {claim_text[:200]}"
        supporting_chunks = await hybrid_retriever.retrieve(
            query_text=query_text,
            db=db,
            top_k=4,
            document_id=document_id
        )

        evidence_snippets = []
        for c in supporting_chunks:
            evidence_snippets.append({
                "page_number": c.page_number,
                "section": c.section or "Detailed Description",
                "filename": c.filename,
                "content_snippet": c.content[:350],
                "similarity_score": round(float(c.score), 4)
            })

        evidence_context = "\n\n".join([
            f"[Page {e['page_number']} | Section: {e['section']}]:\n{e['content_snippet']}"
            for e in evidence_snippets
        ])

        system_prompt = """You are a patent claim analysis specialist.
Your role is to demystify complex patent claim language for engineering and legal research.
Ground your analysis strictly in the provided patent text and evidence.
Do NOT invent claim scope, technical elements, or page numbers."""

        user_prompt = f"""
CLAIM NUMBER: {claim_number} ({claim_type})
CLAIM TEXT:
"{claim_text}"

SUPPORTING PATENT DISCLOSURE EXCERPTS:
{evidence_context}

ACTION REQUESTED: {action}

Respond strictly in valid JSON matching this schema:
{{
  "claim_number": {claim_number},
  "claim_type": "{claim_type}",
  "simplified_explanation": "Clear, plain English explanation avoiding legalese (2-3 sentences)",
  "technical_components": [
    {{"component": "Component Name", "function": "Role or limitation defined in the claim"}}
  ],
  "supporting_disclosures": [
    {{"page_number": 1, "section": "Section name", "support_summary": "How this part supports the claim elements"}}
  ]
}}
"""

        try:
            res = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            content = res.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            result_data = json.loads(content.strip())
            result_data["original_claim"] = claim_text
            result_data["evidence_citations"] = evidence_snippets
            return result_data

        except Exception as e:
            logger.error(f"Error in claim analysis: {e}")
            return {
                "claim_number": claim_number,
                "claim_type": claim_type,
                "original_claim": claim_text,
                "simplified_explanation": f"Claim {claim_number} defines the technical requirements and operating bounds for: {claim_text[:120]}...",
                "technical_components": [
                    {"component": f"Claim {claim_number} Structure", "function": "Primary inventive specification and limitation"}
                ],
                "supporting_disclosures": [
                    {
                        "page_number": e["page_number"],
                        "section": e["section"],
                        "support_summary": e["content_snippet"][:150]
                    } for e in evidence_snippets[:2]
                ],
                "evidence_citations": evidence_snippets
            }


claim_analyzer = ClaimAnalyzerService()
