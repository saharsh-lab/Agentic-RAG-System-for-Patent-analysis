import io
import fitz
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app


def create_metadata_pdf_bytes() -> bytes:
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 50), "(19) United States Patent\n(10) Patent No.: US 10,987,654 B2\n(45) Date of Patent: Sep. 20, 2022")
    page1.insert_text((50, 150), "(75) Inventors: Dr. Alice Smith, Dr. Bob Jones\n(73) Assignee: Global Battery Innovations Inc.")
    page1.insert_text((50, 250), "ABSTRACT\nA solid-state battery electrolyte composition.")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_publication_date_metadata_query():
    pdf_bytes = create_metadata_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Upload
        files = {"file": ("us10987654.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        # Query publication date
        resp = await client.post("/api/v1/chat/query", json={
            "question": "When was this patent published?",
            "document_id": doc_id,
            "use_agent": True
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data["query_type"] == "PATENT_METADATA"
        assert "answer" in data
        assert len(data["answer"]) > 0
        assert len(data["citations"]) > 0


@pytest.mark.asyncio
async def test_inventors_metadata_query():
    pdf_bytes = create_metadata_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("us10987654.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        resp = await client.post("/api/v1/chat/query", json={
            "question": "Who are the inventors listed in this patent?",
            "document_id": doc_id,
            "use_agent": True
        })
        assert resp.status_code == 200
        data = resp.json()

        assert data["query_type"] == "PATENT_METADATA"
        assert len(data["citations"]) > 0
