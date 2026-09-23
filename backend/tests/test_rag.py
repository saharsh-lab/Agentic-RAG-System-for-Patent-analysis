import io
import fitz
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app


def create_patent_pdf_bytes() -> bytes:
    doc = fitz.open()
    
    page1 = doc.new_page()
    page1.insert_text((50, 50), "ABSTRACT\nAn autonomous thermal management system for high-capacity lithium iron phosphate batteries.")
    page1.insert_text((50, 150), "BACKGROUND\nTraditional cooling loops consume excessive parasitic power.")

    page2 = doc.new_page()
    page2.insert_text((50, 50), "SUMMARY OF THE INVENTION\nThe cooling system utilizes phase-change materials (PCM) integrated into modular heat sinks.")
    page2.insert_text((50, 150), "CLAIMS\n1. A cooling system comprising phase-change material.")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_basic_rag_query():
    pdf_bytes = create_patent_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload sample document
        files = {"file": ("battery_patent.pdf", pdf_bytes, "application/pdf")}
        upload_resp = await client.post("/api/v1/documents/upload", files=files)
        assert upload_resp.status_code == 201
        doc_data = upload_resp.json()
        doc_id = doc_data["id"]

        # 2. Query basic RAG endpoint
        query_payload = {
            "question": "What cooling material is used in the battery invention?",
            "document_id": doc_id,
            "top_k": 3,
            "use_agent": False
        }
        chat_resp = await client.post("/api/v1/chat/query", json=query_payload)
        assert chat_resp.status_code == 200
        chat_data = chat_resp.json()

        assert "answer" in chat_data
        assert len(chat_data["answer"]) > 0
        assert len(chat_data["citations"]) > 0

        # Verify citation metadata
        first_citation = chat_data["citations"][0]
        assert "battery_patent.pdf" in first_citation["filename"]
        assert first_citation["page_number"] in [1, 2]
        assert first_citation["similarity_score"] >= 0.0
