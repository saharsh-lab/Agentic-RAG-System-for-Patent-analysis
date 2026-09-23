from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from langgraph.graph import StateGraph, END

from app.config import settings
from app.agents.state import AgentState
from app.agents.analyzer import query_analyzer
from app.agents.sufficiency import sufficiency_checker
from app.retrieval.fusion import hybrid_retriever
from app.retrieval.normalization import evidence_normalizer, UnifiedEvidence
from app.patents.epo import epo_adapter
from app.web.adapter import web_search_adapter
from app.rag.generator import rag_generator
from app.verification.extractor import claim_extractor
from app.verification.verifier import claim_verifier


class AgenticPatentPlanner:
    def __init__(self):
        self.workflow = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(AgentState)

        # Add Nodes
        workflow.add_node("analyze_query", self._analyze_query_node)
        workflow.add_node("retrieve_document", self._retrieve_document_node)
        workflow.add_node("check_sufficiency", self._check_sufficiency_node)
        workflow.add_node("select_sources", self._select_sources_node)
        workflow.add_node("retrieve_external_evidence", self._retrieve_external_evidence_node)
        workflow.add_node("generate_answer", self._generate_answer_node)
        workflow.add_node("extract_verify_claims", self._extract_verify_claims_node)
        workflow.add_node("corrective_research", self._corrective_research_node)

        # Connect Edges
        workflow.set_entry_point("analyze_query")
        workflow.add_edge("analyze_query", "retrieve_document")
        workflow.add_edge("retrieve_document", "check_sufficiency")

        # Conditional routing after sufficiency check
        workflow.add_conditional_edges(
            "check_sufficiency",
            self._route_after_sufficiency,
            {
                "SUFFICIENT": "generate_answer",
                "INSUFFICIENT": "select_sources"
            }
        )

        workflow.add_edge("select_sources", "retrieve_external_evidence")
        workflow.add_edge("retrieve_external_evidence", "generate_answer")
        workflow.add_edge("generate_answer", "extract_verify_claims")

        # Conditional routing for corrective research loop
        workflow.add_conditional_edges(
            "extract_verify_claims",
            self._route_after_verification,
            {
                "COMPLETE": END,
                "NEEDS_RESEARCH": "corrective_research"
            }
        )

        workflow.add_edge("corrective_research", "retrieve_external_evidence")

        return workflow.compile()

    async def _analyze_query_node(self, state: AgentState) -> Dict[str, Any]:
        analysis = query_analyzer.analyze(state["question"])
        return {
            "query_type": analysis["query_type"],
            "extracted_entities": analysis["extracted_entities"],
            "iteration_count": 1,
            "is_complete": False
        }

    async def _retrieve_document_node(self, state: AgentState, db: AsyncSession = None) -> Dict[str, Any]:
        chunks = getattr(state, "_retrieved_chunks", [])
        normalized_doc_ev = [evidence_normalizer.normalize_document_chunk(c).model_dump() for c in chunks]
        return {
            "document_evidence": normalized_doc_ev
        }

    async def _check_sufficiency_node(self, state: AgentState) -> Dict[str, Any]:
        result = sufficiency_checker.check_sufficiency(
            question=state["question"],
            query_type=state["query_type"],
            document_evidence=state.get("document_evidence", [])
        )
        return {
            "evidence_sufficiency": result["sufficiency"],
            "missing_information": result.get("missing_information"),
            "selected_sources": result.get("recommended_sources", ["DOCUMENT"])
        }

    def _route_after_sufficiency(self, state: AgentState) -> str:
        if state.get("evidence_sufficiency") == "SUFFICIENT":
            return "SUFFICIENT"
        return "INSUFFICIENT"

    async def _select_sources_node(self, state: AgentState) -> Dict[str, Any]:
        sources = ["DOCUMENT"]
        qt = state.get("query_type")
        if qt in ["LEGAL_STATUS", "PATENT_RESEARCH", "PATENT_METADATA"]:
            sources.append("PATENT_API")
        elif qt == "CURRENT_TECHNOLOGY_RESEARCH":
            sources.append("WEB")
        elif qt == "MULTI_SOURCE_COMPARISON":
            sources.extend(["PATENT_API", "WEB"])
        else:
            sources.append("PATENT_API")
        return {"selected_sources": list(set(sources))}

    async def _retrieve_external_evidence_node(self, state: AgentState) -> Dict[str, Any]:
        patent_ev = list(state.get("patent_evidence", []))
        web_ev = list(state.get("web_evidence", []))
        sources = state.get("selected_sources", [])

        question = state["question"]
        entities = state.get("extracted_entities", [])
        
        doc_ev = state.get("document_evidence", [])
        pub_num = "EP3819283"
        if entities:
            pub_num = entities[0]
        elif doc_ev:
            fn = doc_ev[0].get("source_name", "")
            clean_fn = fn.replace("Document: ", "").replace(".pdf", "").replace(".docx", "").upper()
            if clean_fn and len(clean_fn) >= 4:
                pub_num = clean_fn

        if "PATENT_API" in sources and not patent_ev:
            if state.get("query_type") == "LEGAL_STATUS":
                legal_status_str = await epo_adapter.get_legal_status(pub_num)
                patent_obj = await epo_adapter.get_details(pub_num)
                if patent_obj:
                    patent_obj.legal_status = legal_status_str
                    ev_item = evidence_normalizer.normalize_patent(patent_obj)
                    patent_ev.append(ev_item.model_dump())
            elif state.get("query_type") == "PATENT_METADATA":
                patent_obj = await epo_adapter.get_details(pub_num)
                if patent_obj:
                    ev_item = evidence_normalizer.normalize_patent(patent_obj)
                    patent_ev.append(ev_item.model_dump())
            else:
                p_resp = await epo_adapter.search(question, limit=2)
                for p in p_resp.results:
                    ev_item = evidence_normalizer.normalize_patent(p)
                    patent_ev.append(ev_item.model_dump())

        if "WEB" in sources and not web_ev:
            w_results = await web_search_adapter.search(question, limit=2)
            for w in w_results:
                ev_item = evidence_normalizer.normalize_web_result(w)
                web_ev.append(ev_item.model_dump())

        return {
            "patent_evidence": patent_ev,
            "web_evidence": web_ev
        }

    async def _generate_answer_node(self, state: AgentState) -> Dict[str, Any]:
        doc_ev = state.get("document_evidence", [])
        pat_ev = state.get("patent_evidence", [])
        web_ev = state.get("web_evidence", [])
        query_type = state.get("query_type", "DOCUMENT_ANALYSIS")

        all_ev = []
        if doc_ev and query_type != "MULTI_SOURCE_COMPARISON":
            all_ev.extend([UnifiedEvidence(**item) for item in doc_ev])
        else:
            all_ev.extend([UnifiedEvidence(**item) for item in doc_ev])
            all_ev.extend([UnifiedEvidence(**item) for item in pat_ev])
            all_ev.extend([UnifiedEvidence(**item) for item in web_ev])

        deduped_ev = evidence_normalizer.deduplicate(all_ev)

        # Convert back to RetrievedChunk format for RAG Generator
        from app.retrieval.semantic import RetrievedChunk
        rag_chunks = []
        for ev in deduped_ev:
            doc_id = ev.metadata.get("document_id") or "00000000-0000-0000-0000-000000000000"
            rag_chunks.append(RetrievedChunk(
                chunk_id=UUID("00000000-0000-0000-0000-000000000000"),
                document_id=UUID(doc_id) if isinstance(doc_id, str) and len(doc_id) == 36 else UUID("00000000-0000-0000-0000-000000000000"),
                filename=ev.source_name,
                content=ev.content,
                page_number=ev.metadata.get("page_number"),
                section=ev.metadata.get("section"),
                chunk_index=0,
                similarity_score=ev.relevance_score
            ))

        answer_text = await rag_generator.generate_answer(
            question=state["question"],
            retrieved_chunks=rag_chunks
        )

        return {"generated_answer": answer_text}

    async def _extract_verify_claims_node(self, state: AgentState) -> Dict[str, Any]:
        answer_text = state.get("generated_answer", "")
        claims = claim_extractor.extract_claims(answer_text)

        all_ev = []
        all_ev.extend([UnifiedEvidence(**item) for item in state.get("document_evidence", [])])
        all_ev.extend([UnifiedEvidence(**item) for item in state.get("patent_evidence", [])])
        all_ev.extend([UnifiedEvidence(**item) for item in state.get("web_evidence", [])])

        verifications = claim_verifier.verify_claims(claims, all_ev)

        return {
            "extracted_claims": claims,
            "claim_verifications": verifications
        }

    def _route_after_verification(self, state: AgentState) -> str:
        verifications = state.get("claim_verifications", [])
        unsupported = [v for v in verifications if v.get("status") == "UNSUPPORTED"]

        if unsupported and state.get("iteration_count", 1) < settings.MAX_RESEARCH_ITERATIONS:
            return "NEEDS_RESEARCH"
        return "COMPLETE"

    async def _corrective_research_node(self, state: AgentState) -> Dict[str, Any]:
        cur_iter = state.get("iteration_count", 1) + 1
        verifications = state.get("claim_verifications", [])
        unsupported = [v for v in verifications if v.get("status") == "UNSUPPORTED"]

        # Formulate targeted query for unsupported claim
        target_query = unsupported[0]["claim_text"] if unsupported else state["question"]

        # Fetch additional external evidence for target query
        w_results = await web_search_adapter.search(target_query, limit=2)
        web_ev = list(state.get("web_evidence", []))
        for w in w_results:
            web_ev.append(evidence_normalizer.normalize_web_result(w).model_dump())

        return {
            "iteration_count": cur_iter,
            "web_evidence": web_ev
        }

    async def run(self, question: str, db: AsyncSession, document_id: UUID = None) -> AgentState:
        # Retrieve local document evidence first
        doc_chunks = await hybrid_retriever.retrieve(
            query_text=question,
            db=db,
            top_k=5,
            document_id=document_id
        )

        trail: List[str] = [
            "✓ Read uploaded patent document and processed sections/claims",
            f"✓ Retrieved {len(doc_chunks)} relevant document chunks via hybrid keyword & vector search"
        ]

        initial_state: AgentState = {
            "question": question,
            "document_id": document_id,
            "query_type": "DOCUMENT_ANALYSIS",
            "extracted_entities": [],
            "document_evidence": [evidence_normalizer.normalize_document_chunk(c).model_dump() for c in doc_chunks],
            "patent_evidence": [],
            "web_evidence": [],
            "evidence_sufficiency": "UNCHECKED",
            "missing_information": None,
            "selected_sources": ["DOCUMENT"],
            "generated_answer": None,
            "extracted_claims": [],
            "claim_verifications": [],
            "research_trail": trail,
            "iteration_count": 1,
            "is_complete": False
        }

        # Run graph step-by-step
        state = initial_state
        state.update(await self._analyze_query_node(state))
        trail.append(f"✓ Classified question intent: {state['query_type']}")

        state.update(await self._check_sufficiency_node(state))
        if state["evidence_sufficiency"] == "SUFFICIENT":
            trail.append("✓ Evidence sufficiency check: Local document evidence is SUFFICIENT")
        else:
            trail.append("⚠ Evidence sufficiency check: Local document evidence INSUFFICIENT -> Escalating")
            state.update(await self._select_sources_node(state))
            trail.append(f"✓ Selected external sources: {', '.join(state['selected_sources'])}")
            state.update(await self._retrieve_external_evidence_node(state))
            if "PATENT_API" in state["selected_sources"]:
                trail.append(f"✓ Searched EPO OPS patent database (found {len(state.get('patent_evidence', []))} candidate patents)")
            if "WEB" in state["selected_sources"]:
                trail.append(f"✓ Executed external research via Tavily Web Search ({len(state.get('web_evidence', []))} results)")

        trail.append("✓ Synthesized grounded RAG answer from retrieved evidence")
        state.update(await self._generate_answer_node(state))
        state.update(await self._extract_verify_claims_node(state))
        trail.append(f"✓ Extracted {len(state.get('extracted_claims', []))} atomic claims and verified against evidence")

        # Check for bounded corrective loop
        if self._route_after_verification(state) == "NEEDS_RESEARCH":
            trail.append(f"🔄 Corrective research loop: Refining query for unsupported claims (Iteration {state.get('iteration_count', 1) + 1})")
            state.update(await self._corrective_research_node(state))
            state.update(await self._generate_answer_node(state))
            state.update(await self._extract_verify_claims_node(state))
            trail.append("✓ Re-verified claims after corrective research cycle")

        trail.append("✓ Generated final response with citations and claim verification badges")
        state["research_trail"] = trail
        state["is_complete"] = True
        return state


agentic_planner = AgenticPatentPlanner()
