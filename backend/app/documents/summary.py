import json
import logging
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)


class PatentSummaryGenerator:
    """Generates a structured 8-point patent summary grounded in parsed patent text."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=settings.OPENAI_API_KEY or "sk-placeholder-key-for-init",
            temperature=0.0
        )

    async def generate_summary(
        self,
        raw_text: str,
        metadata: Optional[Dict[str, Any]] = None,
        sections: Optional[Dict[str, str]] = None,
        claims: Optional[list] = None
    ) -> Dict[str, Any]:
        metadata = metadata or {}
        sections = sections or {}
        claims = claims or []

        # Build focused context from first 4000 characters and sections
        title = metadata.get("title") or "Unknown Title"
        pub_num = metadata.get("publication_number") or "N/A"
        abstract = sections.get("Abstract") or raw_text[:1200]
        background = sections.get("Background") or sections.get("Problem Statement") or raw_text[1200:2400]
        solution = sections.get("Proposed Solution") or sections.get("Summary") or raw_text[2400:3600]
        claims_sample = "\n".join([f"Claim {c.get('claim_number')}: {c.get('claim_text')[:180]}..." for c in claims[:3]])

        context_prompt = f"""
PATENT TITLE: {title}
PUBLICATION NUMBER: {pub_num}
ABSTRACT:
{abstract[:1000]}

BACKGROUND / PROBLEM:
{background[:1000]}

PROPOSED SOLUTION / EMBODIMENTS:
{solution[:1000]}

KEY CLAIMS:
{claims_sample}
"""

        system_prompt = """You are a senior patent intelligence analyst.
Analyze the provided patent text and produce a strictly factual, structured 8-point summary.
Do NOT invent patent numbers, inventors, organizations, or experimental results. Ground every point in the provided text.

Return your response ONLY as valid JSON with the following exact keys:
{
  "overview": "Clear 2-3 sentence overview of the invention",
  "problem_solved": "The specific technical problem, deficiency of prior art, or bottleneck addressed",
  "proposed_solution": "The core technical solution, architecture, or chemical/physical formulation proposed",
  "main_technologies": ["List", "of", "core", "technologies", "used"],
  "key_components": ["List", "of", "physical", "or", "algorithmic", "components"],
  "important_claims": ["Summary of primary independent claim", "Key dependent limitations"],
  "advantages": ["Point 1 advantage over prior art", "Point 2 efficiency/safety gain"],
  "limitations": ["Technical boundaries, operating constraints, or unaddressed areas"]
}
"""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=context_prompt)
            ])
            content = response.content.strip()
            # Clean markdown code blocks if returned
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            summary_dict = json.loads(content.strip())
            return summary_dict

        except Exception as e:
            logger.warning(f"LLM summary generation encountered error, falling back to deterministic extraction: {e}")
            # Deterministic fallback
            return {
                "overview": f"Patent disclosure for {title} ({pub_num}). {abstract[:200]}...",
                "problem_solved": background[:300] if background else "Technical optimization and operational efficiency.",
                "proposed_solution": solution[:300] if solution else "Novel apparatus and methodological formulation.",
                "main_technologies": [metadata.get("ipc_codes", ["Patent Technology"])[:3]] if metadata.get("ipc_codes") else ["Patent Technical Architecture"],
                "key_components": [f"Claim {c.get('claim_number')} Component" for c in claims[:3]] or ["Disclosed Technical System"],
                "important_claims": [c.get("claim_text", "")[:150] for c in claims[:2]] or ["Claim 1: Apparatus according to disclosure."],
                "advantages": ["Improved technical performance and verifiable claim execution."],
                "limitations": ["Constrained to disclosed specifications and operating parameters."]
            }


patent_summary_generator = PatentSummaryGenerator()
