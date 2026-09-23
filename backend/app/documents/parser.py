import io
import re
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
import docx


class ParsedPageContent:
    def __init__(self, page_number: int, text: str, section: str = "General"):
        self.page_number = page_number
        self.text = text
        self.section = section


class ParsedDocument:
    def __init__(
        self,
        filename: str,
        file_type: str,
        pages: List[ParsedPageContent],
        raw_text: str,
        metadata: Optional[Dict[str, Any]] = None,
        sections: Optional[Dict[str, str]] = None,
        claims: Optional[List[Dict[str, Any]]] = None
    ):
        self.filename = filename
        self.file_type = file_type
        self.pages = pages
        self.raw_text = raw_text
        self.metadata = metadata or {}
        self.sections = sections or {}
        self.claims = claims or []


# 8 Patent-Specific Section Identification Patterns
PATENT_SECTION_PATTERNS = [
    (re.compile(r'^\s*(?:ABSTRACT|Abstract)\b', re.IGNORECASE | re.MULTILINE), "Abstract"),
    (re.compile(r'^\s*(?:TECHNICAL FIELD|FIELD OF THE INVENTION)\b', re.IGNORECASE | re.MULTILINE), "Technical Field"),
    (re.compile(r'^\s*(?:BACKGROUND(?: OF THE INVENTION)?)\b', re.IGNORECASE | re.MULTILINE), "Background"),
    (re.compile(r'^\s*(?:TECHNICAL PROBLEM|PROBLEM TO BE SOLVED|PROBLEM STATEMENT)\b', re.IGNORECASE | re.MULTILINE), "Problem Statement"),
    (re.compile(r'^\s*(?:SOLUTION TO PROBLEM|SUMMARY(?: OF THE INVENTION)?|PROPOSED SOLUTION)\b', re.IGNORECASE | re.MULTILINE), "Proposed Solution"),
    (re.compile(r'^\s*(?:DETAILED DESCRIPTION(?: OF PREFERRED EMBODIMENTS)?|TECHNICAL COMPONENTS|DESCRIPTION OF EMBODIMENTS)\b', re.IGNORECASE | re.MULTILINE), "Technical Components"),
    (re.compile(r'^\s*(?:ADVANTAGES?|ADVANTAGEOUS EFFECTS?|LIMITATIONS?)\b', re.IGNORECASE | re.MULTILINE), "Advantages / Limitations"),
    (re.compile(r'^\s*(?:CLAIMS?|WHAT IS CLAIMED IS)\b', re.IGNORECASE | re.MULTILINE), "Claims"),
    (re.compile(r'^\s*(?:REFERENCES(?: CITED)?|PRIOR ART)\b', re.IGNORECASE | re.MULTILINE), "References"),
]


def detect_section(text_snippet: str, current_section: str = "General") -> str:
    """Detects patent section header from text snippet, maintaining current context if none found."""
    for pattern, section_name in PATENT_SECTION_PATTERNS:
        if pattern.search(text_snippet):
            return section_name
    return current_section


def extract_patent_metadata(raw_text: str, filename: str = "") -> Dict[str, Any]:
    """Extracts standard patent bibliographic metadata from raw text."""
    metadata: Dict[str, Any] = {
        "title": None,
        "publication_number": None,
        "application_number": None,
        "inventors": [],
        "applicants": [],
        "filing_date": None,
        "publication_date": None,
        "ipc_codes": [],
        "cpc_codes": [],
    }

    # Publication Number: e.g. US 2026/0280324 A1, EP 3819283 B1, WO 2024/123456
    pub_match = re.search(r'\b([A-Z]{2}\s*[\d/]{6,12}\s*[A-Z]\d?)\b', raw_text[:2500])
    if pub_match:
        metadata["publication_number"] = re.sub(r'\s+', '', pub_match.group(1))
    elif re.search(r'([A-Z]{2}\d{7,10}[A-Z]\d?)', filename):
        metadata["publication_number"] = re.search(r'([A-Z]{2}\d{7,10}[A-Z]\d?)', filename).group(1)

    # Title detection
    title_match = re.search(r'(?:\(54\)\s*(?:Title|TITLE)?:?\s*|\bTITLE:\s*)([^\n]{5,180})', raw_text[:2500], re.IGNORECASE)
    if title_match:
        metadata["title"] = title_match.group(1).strip()
    else:
        # Fallback: look at prominent line in first 1000 characters
        lines = [line.strip() for line in raw_text[:1200].split("\n") if len(line.strip()) > 10 and not line.strip().isdigit()]
        if lines:
            metadata["title"] = lines[0].strip(" -#*")

    # Application Number
    app_match = re.search(r'(?:\(21\)\s*Appl\.?\s*No\.?:?\s*|\bApplication No\.?:?\s*)([0-9/,\s]{6,18})', raw_text[:3000], re.IGNORECASE)
    if app_match:
        metadata["application_number"] = re.sub(r'\s+', '', app_match.group(1)).strip()

    # Dates
    pub_date_match = re.search(r'(?:\(45\)\s*Date of Patent:?|\(43\)\s*Pub\.?\s*Date:?|\bPublication Date:?)\s*([A-Za-z]{3,9}\.?\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})', raw_text[:3000], re.IGNORECASE)
    if pub_date_match:
        metadata["publication_date"] = pub_date_match.group(1).strip()

    filing_date_match = re.search(r'(?:\(22\)\s*Filed:?|\bFiling Date:?)\s*([A-Za-z]{3,9}\.?\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})', raw_text[:3000], re.IGNORECASE)
    if filing_date_match:
        metadata["filing_date"] = filing_date_match.group(1).strip()

    # Inventors
    inv_match = re.search(r'(?:\(75\)\s*Inventors?:?|\(72\)\s*Inventors?:?|\bInventors?:?\s*)([^\n\(]{5,200})', raw_text[:3500], re.IGNORECASE)
    if inv_match:
        inv_str = inv_match.group(1).strip()
        metadata["inventors"] = [inv.strip() for inv in re.split(r'[,;]|\band\b', inv_str) if len(inv.strip()) > 2]

    # Assignees / Applicants
    ass_match = re.search(r'(?:\(73\)\s*Assignee:?|\(71\)\s*Applicant:?|\bAssignees?:?|\bApplicants?:?\s*)([^\n\(]{5,200})', raw_text[:3500], re.IGNORECASE)
    if ass_match:
        ass_str = ass_match.group(1).strip()
        metadata["applicants"] = [a.strip() for a in re.split(r'[,;]|\band\b', ass_str) if len(a.strip()) > 2]

    # IPC / CPC classifications: e.g. H01M 10/0525, B60L 58/12
    codes = re.findall(r'\b([A-H]\d{2}[A-Z]\s*\d{1,4}/\d{2,6})\b', raw_text[:4000])
    if codes:
        metadata["ipc_codes"] = list(dict.fromkeys(codes))[:10]

    return metadata


def parse_patent_claims(raw_text: str) -> List[Dict[str, Any]]:
    """Detects, parses, and classifies independent and dependent claims."""
    claims_list: List[Dict[str, Any]] = []

    # Find the claims section in the text
    claims_start_match = re.search(r'\b(?:CLAIMS?|WHAT IS CLAIMED IS:?)\b', raw_text, re.IGNORECASE)
    claims_text = raw_text[claims_start_match.start():] if claims_start_match else raw_text

    # Match each claim starting with a number e.g. "1. A ...", "Claim 1. ...", "1 (Currently Amended)"
    pattern = re.compile(
        r'(?:^|\n)\s*(?:Claim\s+)?(\d{1,3})\s*[\.\:\-\)]\s*(.*?)(?=(?:\n\s*(?:Claim\s+)?\d{1,3}\s*[\.\:\-\)])|\Z)',
        re.DOTALL | re.IGNORECASE
    )

    matches = list(pattern.finditer(claims_text))
    for m in matches:
        claim_num = int(m.group(1))
        claim_body = " ".join(m.group(2).split()).strip()

        if len(claim_body) < 15:
            continue

        # Detect dependency: "The method of claim 1", "according to claim 3", "as defined in claim 1"
        dep_match = re.search(
            r'\b(?:according to|of|as claimed in|as defined in|in accordance with)\s+claims?\s+(\d{1,3})\b',
            claim_body,
            re.IGNORECASE
        )

        if dep_match:
            claim_type = "DEPENDENT"
            parent_claim = int(dep_match.group(1))
        else:
            claim_type = "INDEPENDENT"
            parent_claim = None

        claims_list.append({
            "claim_number": claim_num,
            "claim_type": claim_type,
            "parent_claim": parent_claim,
            "claim_text": claim_body,
            "is_independent": claim_type == "INDEPENDENT"
        })

    # If regex missed claims because of formatting, extract at least a fallback
    if not claims_list and claims_start_match:
        fallback_snippet = claims_text[:1200].strip()
        claims_list.append({
            "claim_number": 1,
            "claim_type": "INDEPENDENT",
            "parent_claim": None,
            "claim_text": fallback_snippet,
            "is_independent": True
        })

    return claims_list


def aggregate_sections(pages: List[ParsedPageContent]) -> Dict[str, str]:
    """Aggregates page texts into grouped section contents."""
    sections_map: Dict[str, List[str]] = {}
    for page in pages:
        sec = page.section or "General"
        if sec not in sections_map:
            sections_map[sec] = []
        sections_map[sec].append(page.text)
    
    return {sec: "\n\n".join(texts) for sec, texts in sections_map.items()}


class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes, filename: str) -> ParsedDocument:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages: List[ParsedPageContent] = []
        full_text_list = []
        current_section = "General"

        for page_num, page in enumerate(doc, start=1):
            page_text = page.get_text("text") or ""
            new_section = detect_section(page_text[:400], current_section)
            current_section = new_section

            pages.append(ParsedPageContent(
                page_number=page_num,
                text=page_text,
                section=current_section
            ))
            full_text_list.append(page_text)

        raw_text = "\n\n".join(full_text_list)
        metadata = extract_patent_metadata(raw_text, filename)
        sections = aggregate_sections(pages)
        claims = parse_patent_claims(raw_text)

        return ParsedDocument(
            filename=filename,
            file_type="pdf",
            pages=pages,
            raw_text=raw_text,
            metadata=metadata,
            sections=sections,
            claims=claims
        )

    @staticmethod
    def parse_docx(file_bytes: bytes, filename: str) -> ParsedDocument:
        doc_stream = io.BytesIO(file_bytes)
        document = docx.Document(doc_stream)
        pages: List[ParsedPageContent] = []
        paragraph_texts = []
        current_section = "General"
        
        current_page = 1
        word_count = 0
        current_page_text = []

        for p in document.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            
            if p.style.name.startswith("Heading") or len(text) < 100:
                current_section = detect_section(text, current_section)

            current_page_text.append(text)
            paragraph_texts.append(text)
            word_count += len(text.split())

            if word_count >= 500:
                pages.append(ParsedPageContent(
                    page_number=current_page,
                    text="\n".join(current_page_text),
                    section=current_section
                ))
                current_page += 1
                word_count = 0
                current_page_text = []

        if current_page_text:
            pages.append(ParsedPageContent(
                page_number=current_page,
                text="\n".join(current_page_text),
                section=current_section
            ))

        raw_text = "\n\n".join(paragraph_texts)
        metadata = extract_patent_metadata(raw_text, filename)
        sections = aggregate_sections(pages)
        claims = parse_patent_claims(raw_text)

        return ParsedDocument(
            filename=filename,
            file_type="docx",
            pages=pages,
            raw_text=raw_text,
            metadata=metadata,
            sections=sections,
            claims=claims
        )

    @staticmethod
    def parse_txt(file_bytes: bytes, filename: str) -> ParsedDocument:
        text = file_bytes.decode("utf-8", errors="replace")
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        
        pages: List[ParsedPageContent] = []
        current_section = "General"
        current_page = 1
        word_count = 0
        current_page_text = []

        for p in paragraphs:
            current_section = detect_section(p[:200], current_section)
            current_page_text.append(p)
            word_count += len(p.split())

            if word_count >= 500:
                pages.append(ParsedPageContent(
                    page_number=current_page,
                    text="\n\n".join(current_page_text),
                    section=current_section
                ))
                current_page += 1
                word_count = 0
                current_page_text = []

        if current_page_text:
            pages.append(ParsedPageContent(
                page_number=current_page,
                text="\n\n".join(current_page_text),
                section=current_section
            ))

        metadata = extract_patent_metadata(text, filename)
        sections = aggregate_sections(pages)
        claims = parse_patent_claims(text)

        return ParsedDocument(
            filename=filename,
            file_type="txt",
            pages=pages,
            raw_text=text,
            metadata=metadata,
            sections=sections,
            claims=claims
        )

    @classmethod
    def parse(cls, file_bytes: bytes, filename: str) -> ParsedDocument:
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            return cls.parse_pdf(file_bytes, filename)
        elif ext in ["docx", "doc"]:
            return cls.parse_docx(file_bytes, filename)
        elif ext == "txt":
            return cls.parse_txt(file_bytes, filename)
        else:
            raise ValueError(f"Unsupported file type extension: .{ext}. Allowed formats are PDF, DOCX, and TXT.")
