export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  upload_timestamp: string;
  chunk_count: number;
  metadata?: Record<string, any>;
  summary?: PatentSummary;
  claims_count?: number;
}

export interface SourceCitation {
  chunk_id?: string;
  document_id?: string;
  filename: string;
  page_number?: number;
  section?: string;
  content: string;
  similarity_score: number;
}

export interface ClaimVerificationItem {
  claim_id?: string;
  claim_text: string;
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'UNCERTAIN';
  confidence: number;
  explanation?: string;
  supporting_evidence_ids?: string[];
}

export interface ChatQueryResponse {
  query_id: string;
  answer_id: string;
  question: string;
  answer: string;
  query_type: string;
  evidence_sufficiency: 'SUFFICIENT' | 'INSUFFICIENT' | 'UNCERTAIN';
  selected_sources: string[];
  iteration_count: number;
  research_trail?: string[];
  citations: SourceCitation[];
  claim_verifications: ClaimVerificationItem[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface ConversationSummary {
  id: string;
  title: string;
  document_id?: string;
  document_name?: string;
  query_count: number;
  created_at: string;
  updated_at: string;
}

export interface MessageItem {
  query_id: string;
  question: string;
  query_type?: string;
  created_at: string;
  response: ChatQueryResponse;
}

export interface ConversationDetail {
  id: string;
  title: string;
  document_id?: string;
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
}

export interface FlaggedClaim {
  claim_id: string;
  claim_text: string;
  status: string;
  confidence?: number;
  explanation?: string;
  question: string;
  answer_text: string;
  created_at: string;
}

export interface HallucinationAnalytics {
  total_claims: number;
  supported_count: number;
  partially_supported_count: number;
  unsupported_count: number;
  support_rate: number;
  hallucination_rate: number;
  grounding_score: number;
  flagged_claims: FlaggedClaim[];
}

export interface PatentItem {
  publication_number: string;
  application_number?: string;
  title?: string;
  abstract?: string;
  claims?: string[];
  description?: string;
  inventors?: string[];
  applicants?: string[];
  filing_date?: string;
  publication_date?: string;
  jurisdictions?: string[];
  cpc_codes?: string[];
  ipc_codes?: string[];
  legal_status?: string;
  citations?: string[];
  family_members?: string[];
  source: string;
  source_url?: string;
  retrieved_at?: string;
}

export interface PatentSearchResponse {
  query: string;
  total_results: number;
  results: PatentItem[];
}

// ==========================================
// NEW RESEARCH-ORIENTED TYPES
// ==========================================

export interface PatentSummary {
  overview: string;
  problem_solved: string;
  proposed_solution: string;
  main_technologies: string[];
  key_components: string[];
  important_claims: string[];
  advantages: string[];
  limitations: string[];
}

export interface PatentClaim {
  claim_number: number;
  claim_type: 'INDEPENDENT' | 'DEPENDENT';
  parent_claim?: number | null;
  claim_text: string;
  is_independent: boolean;
}

export interface ClaimAnalysisResult {
  claim_number: number;
  claim_type: string;
  original_claim: string;
  simplified_explanation: string;
  technical_components: Array<{ component: string; function: string }>;
  supporting_disclosures: Array<{ page_number?: number; section?: string; support_summary: string }>;
  evidence_citations: Array<{ page_number?: number; section?: string; filename: string; content_snippet: string; similarity_score: number }>;
}

export interface SimilarPatentResult {
  publication_number: string;
  title: string;
  source: string;
  similarity_score: number;
  score_type: string;
  retrieval_reason: string;
  abstract: string;
  disclaimer: string;
  applicants?: string[];
  inventors?: string[];
  ipc_codes?: string[];
  source_url?: string;
}

export interface SimilarPatentsResponse {
  source_patent: string;
  extracted_concepts: string[];
  total_retrieved: number;
  disclaimer: string;
  results: SimilarPatentResult[];
}

export interface ComparisonMatrix {
  technology: { base: string; comparisons: string[] };
  main_problem: { base: string; comparisons: string[] };
  proposed_solution: { base: string; comparisons: string[] };
  technical_components: { base: string[]; comparisons: string[][] };
  claims_features: { base: string; comparisons: string[] };
}

export interface PatentComparisonResponse {
  comparison_matrix: ComparisonMatrix;
  key_similarities: string[];
  key_differences: string[];
  source_attribution: Array<{ publication_number: string; source: string }>;
  disclaimer: string;
}

export interface BenchmarkMetrics {
  name: string;
  retrieval_accuracy: number;
  claim_support_rate: number;
  hallucination_rate: number;
  citation_accuracy: number;
  avg_latency_sec: number;
  avg_tool_calls: number;
  avg_iterations: number;
}

export interface BenchmarkQuestionDetail {
  id: number;
  question: string;
  scenario: string;
  category: string;
  sufficiency: string;
  sources_selected: string[];
  iterations: number;
  baseline_latency_sec: number;
  proposed_latency_sec: number;
  baseline_support_rate: number;
  proposed_support_rate: number;
  pass: boolean;
}

export interface BenchmarkResultResponse {
  question_count: number;
  total_elapsed_time_sec?: number;
  baseline_metrics: BenchmarkMetrics;
  proposed_metrics: BenchmarkMetrics;
  question_details: BenchmarkQuestionDetail[];
  created_at?: string;
}

export interface PatentReportResponse {
  document_id: string;
  filename: string;
  report_sections: Record<string, any>;
  markdown_content: string;
}
