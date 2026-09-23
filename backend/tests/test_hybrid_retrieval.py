import io
import fitz
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app
from app.retrieval.fusion import hybrid_retriever
from app.retrieval.keyword import keyword_retriever


def create_hybrid_test_pdf_bytes() -> bytes:
    doc = fitz.open()
    
    # Page 1: Abstract & Specific Identifiers
    page1 = doc.new_page()
    page1.insert_text((50, 50), "ABSTRACT\nPatent EP3819283 relates to lithium-sulfur batteries using high-purity Li2S.")

    # Page 2: Specific Claims
    page2 = doc.new_page()
    page2.insert_text((50, 50), "CLAIMS\nClaim 1. A lithium-sulfur battery cell.\nClaim 4. The cell of Claim 1 wherein the electrolyte comprises 75% sulfide glass.")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_hybrid_retrieval_and_reranking():
    pdf_bytes = create_hybrid_test_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload sample document
        files = {"file": ("hybrid_patent.pdf", pdf_bytes, "application/pdf")}
        upload_resp = await client.post("/api/v1/documents/upload", files=files)
        assert upload_resp.status_code == 201
        doc_data = upload_resp.json()
        doc_id = doc_data["id"]

        # 2. Test exact keyword search for claim number "Claim 4"
        chat_resp = await client.post("/api/v1/chat/query", json={
            "question": "What is specified in Claim 4?",
            "document_id": doc_id,
            "top_k": 3
        })
        assert chat_resp.status_code == 200
        data = chat_resp.json()
        assert len(data["citations"]) > 0
        # The top citation should mention Claim 4
        assert "Claim 4" in data["citations"][0]["content"] or "Claim 4" in data["answer"]
