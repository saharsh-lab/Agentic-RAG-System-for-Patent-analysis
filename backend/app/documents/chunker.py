import re
from typing import List, Dict, Any
from app.documents.parser import ParsedDocument, detect_section


class DocumentChunkData:
    def __init__(self, content: str, page_number: int, section: str, chunk_index: int):
        self.content = content
        self.page_number = page_number
        self.section = section
        self.chunk_index = chunk_index


class PatentDocumentChunker:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, parsed_doc: ParsedDocument) -> List[DocumentChunkData]:
        chunks: List[DocumentChunkData] = []
        global_chunk_index = 0

        for page in parsed_doc.pages:
            page_text = page.text.strip()
            if not page_text:
                continue

            # Split text by paragraphs or sentence boundaries
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [page_text]

            current_chunk_text = ""
            current_section = page.section or "General"

            for para in paragraphs:
                current_section = detect_section(para[:200], current_section)
                
                if len(current_chunk_text) + len(para) + 2 <= self.chunk_size:
                    if current_chunk_text:
                        current_chunk_text += "\n\n" + para
                    else:
                        current_chunk_text = para
                else:
                    # Save completed chunk
                    if current_chunk_text:
                        chunks.append(DocumentChunkData(
                            content=current_chunk_text,
                            page_number=page.page_number,
                            section=current_section,
                            chunk_index=global_chunk_index
                        ))
                        global_chunk_index += 1

                    # Handle large paragraph if larger than chunk_size
                    if len(para) > self.chunk_size:
                        sub_chunks = self._split_text(para, self.chunk_size, self.chunk_overlap)
                        for sub in sub_chunks:
                            chunks.append(DocumentChunkData(
                                content=sub,
                                page_number=page.page_number,
                                section=current_section,
                                chunk_index=global_chunk_index
                            ))
                            global_chunk_index += 1
                        current_chunk_text = ""
                    else:
                        # Carry over overlap
                        overlap_start = max(0, len(current_chunk_text) - self.chunk_overlap)
                        overlap = current_chunk_text[overlap_start:]
                        current_chunk_text = overlap + "\n\n" + para if overlap else para

            if current_chunk_text:
                chunks.append(DocumentChunkData(
                    content=current_chunk_text,
                    page_number=page.page_number,
                    section=current_section,
                    chunk_index=global_chunk_index
                ))
                global_chunk_index += 1

        return chunks

    def _split_text(self, text: str, size: int, overlap: int) -> List[str]:
        sentences = re.split(r'(?<=[.!?]) +', text)
        results = []
        cur = ""
        for s in sentences:
            if len(cur) + len(s) + 1 <= size:
                cur = f"{cur} {s}".strip()
            else:
                if cur:
                    results.append(cur)
                cur = s
        if cur:
            results.append(cur)
        return results
