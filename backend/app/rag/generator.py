import re
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import settings
from app.retrieval.semantic import RetrievedChunk

class RAGGenerator:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.LLM_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_standard_rag_answer(
        self,
        question: str,
        retrieved_chunks: List[RetrievedChunk]
    ) -> str:
        """Standard Vector RAG response: Direct single-pass vector matching with raw text excerpts."""
        if not retrieved_chunks:
            return "⚡ **Standard Vector RAG Match**: No relevant vector chunks found for this query in the vector database."

        first_chunk = retrieved_chunks[0]
        fn_raw = first_chunk.filename or "Document"
        filename = fn_raw.replace("Document: ", "").strip()
        page_str = f"Page {first_chunk.page_number}" if first_chunk.page_number else "Page 1"
        clean_excerpt = first_chunk.content[:350].replace("\n", " ").strip()

        return (
            f"⚡ **Standard Vector RAG Match** for `{filename}`:\n\n"
            f"• **Direct Vector Excerpt**: \"{clean_excerpt}...\"\n\n"
            f"*[Direct Single-Pass Vector Retrieval | {filename}, {page_str}]*"
        )

    async def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[RetrievedChunk]
    ) -> str:
        if not retrieved_chunks:
            return "The uploaded document contains no relevant evidence to answer this question."

        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks, start=1):
            page_str = f"Page {chunk.page_number}" if chunk.page_number else "Page N/A"
            section_str = f"Section: {chunk.section}" if chunk.section else ""
            header = f"[Source {idx}: Document '{chunk.filename}', {page_str}, {section_str}]"
            context_blocks.append(f"{header}\n{chunk.content}")

        formatted_context = "\n\n---\n\n".join(context_blocks)

        system_prompt = (
            "You are an expert Patent Intelligence Assistant. Your objective is to answer user questions "
            "directly, concisely, simply, and accurately based strictly on the provided patent document context.\n\n"
            "RULES:\n"
            "1. Ground all factual statements directly in the provided context.\n"
            "2. Keep the answer format simple, clear, and easy to read using clean bullet points.\n"
            "3. If the user asks a specific question (e.g., 'when is this patent published?', 'which year is this published?', 'who are the inventors?'), "
            "state the exact answer clearly in bullet format.\n"
            "4. Cite your sources inline using [Source: <filename>, Page <page_number>].\n"
            "5. If evidence in the context is insufficient or inconclusive to answer the question, state clearly: "
            "'Insufficient evidence was found in the available sources.'\n"
            "6. Do NOT fabricate or infer patent numbers, dates, claims, inventors, organizations, or technical specs beyond the provided context."
        )

        user_prompt = f"CONTEXT:\n{formatted_context}\n\nQUESTION: {question}\n\nANSWER:"

        if self.client and self.api_key and self.api_key.startswith("sk-"):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[RAGGenerator] OpenAI API call failed: {e}. Using simple QA synthesis fallback.")
                return self._synthesize_fallback_answer(question, retrieved_chunks)
        else:
            return self._synthesize_fallback_answer(question, retrieved_chunks)

    def _synthesize_fallback_answer(self, question: str, chunks: List[RetrievedChunk]) -> str:
        if not chunks:
            return "No document context available to answer this question."

        q_lower = question.lower().strip()
        sorted_chunks = sorted(chunks, key=lambda c: (c.page_number or 0, c.chunk_index or 0))
        raw_fn = sorted_chunks[0].filename or "Document"
        filename = raw_fn.replace("Document: ", "").strip()
        all_text = "\n".join([c.content for c in sorted_chunks])

        if any(k in q_lower for k in ["publish", "publication date", "pub date", "filed", "filing date", "when was", "when is", "year"]):
            date_match = re.search(r"(?:Date of Patent|Publication Date|Pub Date|Date|Filed|Filing Date):\s*([^\n]+)", all_text, re.I)
            if not date_match:
                date_match = re.search(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}\b", all_text, re.I)
            if not date_match:
                date_match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", all_text)

            if date_match:
                raw_d = date_match.group(1).strip() if ("(" in date_match.group(0) or ":" in date_match.group(0)) else date_match.group(0).strip()
                pub_date = raw_d.split("(")[0].strip()
                page_num = sorted_chunks[0].page_number or 1
                return (
                    f"🤖 **Agentic Patent Analysis**: `{filename}`\n\n"
                    f"• **Publication Date**: {pub_date}\n\n"
                    f"*[Source: {filename}, Page {page_num}]*"
                )
            
            years = sorted(list(set(re.findall(r"\b(19\d{2}|20\d{2})\b", all_text))))
            if years:
                formatted_years = ", ".join(years)
                return (
                    f"🤖 **Agentic Patent Analysis**: `{filename}`\n\n"
                    f"• **Publication Date**: No official patent date header in text\n"
                    f"• **Referenced Timeline / Literature Years**: {formatted_years}\n\n"
                    f"*[Source: {filename}, Page {sorted_chunks[0].page_number or 1}]*"
                )
            else:
                return (
                    f"🤖 **Agentic Patent Analysis**: `{filename}`\n\n"
                    f"• **Publication Date**: No explicit publication date or year found in text disclosures.\n\n"
                    f"*[Source: {filename}, Page 1]*"
                )

        if any(k in q_lower for k in ["inventor", "invented", "who wrote", "authors"]):
            inv_match = re.search(r"(?:Inventors|Inventor):\s*([^\n]+)", all_text, re.I)
            if inv_match:
                inventors = inv_match.group(1).split("(")[0].strip()
                page_num = sorted_chunks[0].page_number or 1
                return (
                    f"🤖 **Agentic Patent Analysis**: `{filename}`\n\n"
                    f"• **Inventors**: {inventors}\n\n"
                    f"*[Source: {filename}, Page {page_num}]*"
                )

        if any(k in q_lower for k in ["assignee", "applicant", "owner", "company", "who owns"]):
            ass_match = re.search(r"(?:Assignee|Applicant):\s*([^\n]+)", all_text, re.I)
            if ass_match:
                assignee = ass_match.group(1).split("(")[0].strip()
                page_num = sorted_chunks[0].page_number or 1
                return (
                    f"🤖 **Agentic Patent Analysis**: `{filename}`\n\n"
                    f"• **Assignee / Applicant**: {assignee}\n\n"
                    f"*[Source: {filename}, Page {page_num}]*"
                )

        is_explicit_overview = any(k in q_lower for k in [
            "overview", "summarize", "summary", "tell me about", "describe", "what is this"
        ])

        if is_explicit_overview:
            title_text = sorted_chunks[0].content[:220].replace("\n", " ").strip()
            page_num = sorted_chunks[0].page_number or 1
            
            bullets = [f"🤖 **Agentic Patent Summary**: `{filename}`\n"]
            bullets.append(f"• **Title & Disclosures**: {title_text}")
            
            if len(sorted_chunks) > 1:
                detail_text = sorted_chunks[1].content[:220].replace("\n", " ").strip()
                bullets.append(f"• **Technical Specifications**: {detail_text}")
                
            bullets.append(f"\n*[Source: {filename}, Page {page_num}]*")
            return "\n".join(bullets)

        lines = [f"🤖 **Agentic Patent Findings**: `{filename}`\n"]
        for idx, c in enumerate(sorted_chunks[:2], start=1):
            clean_snippet = c.content[:200].replace("\n", " ").strip()
            page_str = f"Page {c.page_number}" if c.page_number else "Page 1"
            lines.append(f"• **Finding {idx}**: {clean_snippet} (*{page_str}*)")
        
        lines.append(f"\n*[Source: {filename}]*")
        return "\n".join(lines)

rag_generator = RAGGenerator()
