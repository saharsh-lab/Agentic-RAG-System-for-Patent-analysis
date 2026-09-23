import io
import fitz
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app
from app.agents.graph import agentic_planner


def create_sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 50), "ABSTRACT\nThis patent discloses a solid-state electrolyte battery system with phase-change thermal management.")
    page1.insert_text((50, 150), "CLAIMS\n1. A solid-state lithium battery cell comprising a sulfide glass electrolyte.")
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_scenario_1_document_sufficient():
    pdf_bytes = create_sample_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Upload
        files = {"file": ("patent_doc.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        # Question: What is the main invention?
        resp = await client.post("/api/v1/chat/query", json={
            "question": "What is the main invention in this patent?",
            "document_id": doc_id,
            "use_agent": True
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data["evidence_sufficiency"] == "SUFFICIENT"
        assert "DOCUMENT" in data["selected_sources"]
        assert len(data["claim_verifications"]) > 0


@pytest.mark.asyncio
async def test_scenario_2_document_insufficient_legal_status():
    pdf_bytes = create_sample_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("patent_doc.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        # Question: Is this patent currently active?
        resp = await client.post("/api/v1/chat/query", json={
            "question": "Is this patent currently active?",
            "document_id": doc_id,
            "use_agent": True
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data["query_type"] == "LEGAL_STATUS"
        assert data["evidence_sufficiency"] == "INSUFFICIENT"
        assert "PATENT_API" in data["selected_sources"]
        assert len(data["claim_verifications"]) > 0


@pytest.mark.asyncio
async def test_scenario_3_multi_source_comparison():
    pdf_bytes = create_sample_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("patent_doc.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        # Question: Compare this patent with recent patents and latest developments.
        resp = await client.post("/api/v1/chat/query", json={
            "question": "Compare this patent with recent patents and latest developments.",
            "document_id": doc_id,
            "use_agent": True
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data["query_type"] == "MULTI_SOURCE_COMPARISON"
        assert data["evidence_sufficiency"] == "INSUFFICIENT"
        assert "PATENT_API" in data["selected_sources"] or "WEB" in data["selected_sources"]
        assert len(data["claim_verifications"]) > 0
