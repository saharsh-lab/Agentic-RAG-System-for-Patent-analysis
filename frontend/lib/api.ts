import {
  DocumentItem, ChatQueryResponse, UserProfile, AuthTokenResponse,
  ConversationSummary, ConversationDetail, HallucinationAnalytics
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackendHealth(): Promise<{ status: string; database: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'error', database: 'disconnected' };
  }
}

export async function registerUser(email: string, password: string, fullName?: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Failed to register');
  }
  const data: AuthTokenResponse = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthTokenResponse> {

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Incorrect email or password');
  }
  const data: AuthTokenResponse = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function uploadDocumentFile(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errData.detail || 'Failed to upload document');
  }

  return await res.json();
}

export async function fetchDocumentList(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE_URL}/documents/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch document list');
  return await res.json();
}

export async function deleteDocumentFile(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch conversation list');
  return await res.json();
}

export async function createConversation(title?: string, documentId?: string): Promise<ConversationSummary> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title: title || 'New Conversation', document_id: documentId || null }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return await res.json();
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch conversation details');
  return await res.json();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function sendChatQuery(
  question: string,
  documentId?: string,
  conversationId?: string,
  useAgent: boolean = true
): Promise<ChatQueryResponse> {
  const res = await fetch(`${API_BASE_URL}/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question,
      document_id: documentId || null,
      conversation_id: conversationId || null,
      top_k: 5,
      use_agent: useAgent,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(errData.detail || 'Failed to execute query');
  }

  return await res.json();
}

export async function fetchHallucinationAnalytics(): Promise<HallucinationAnalytics> {
  const res = await fetch(`${API_BASE_URL}/analytics/hallucination`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch hallucination analytics');
  return await res.json();
}

export async function searchPatents(query: string, limit: number = 10): Promise<{ query: string; total_results: number; results: any[] }> {
  const res = await fetch(`${API_BASE_URL}/patents/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to search patents');
  return await res.json();
}

export async function fetchPatentDetails(pubNum: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/patents/${encodeURIComponent(pubNum)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch patent details');
  return await res.json();
}

export async function fetchPatentSummary(documentId: string): Promise<{ document_id: string; filename: string; metadata: any; summary: any }> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch patent summary');
  return await res.json();
}

export async function fetchPatentClaims(documentId: string): Promise<{ document_id: string; filename: string; total_claims: number; independent_claims_count: number; dependent_claims_count: number; claims: any[] }> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/claims`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch patent claims');
  return await res.json();
}

export async function analyzePatentClaim(
  documentId: string,
  claimNumber: number,
  claimText: string,
  claimType: string = 'INDEPENDENT',
  action: string = 'explain_simple'
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/claims/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      claim_number: claimNumber,
      claim_text: claimText,
      claim_type: claimType,
      action,
    }),
  });
  if (!res.ok) throw new Error('Failed to analyze claim');
  return await res.json();
}

export async function searchSimilarPatents(
  documentId?: string,
  query?: string,
  limit: number = 5
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/patents/similarity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      document_id: documentId || null,
      query: query || null,
      limit,
    }),
  });
  if (!res.ok) throw new Error('Failed to retrieve similar patents');
  return await res.json();
}

export async function comparePatentsData(
  basePatent: any,
  comparisonPatents: any[]
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/patents/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      base_patent: basePatent,
      comparison_patents: comparisonPatents,
    }),
  });
  if (!res.ok) throw new Error('Failed to compare patents');
  return await res.json();
}

export async function runEvaluationBenchmark(
  questionCount: number = 5,
  documentId?: string
): Promise<any> {
  const url = `${API_BASE_URL}/evaluation/run?question_count=${questionCount}${documentId ? `&document_id=${documentId}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to run evaluation benchmark');
  return await res.json();
}

export async function fetchLatestBenchmark(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/evaluation/latest`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch latest benchmark');
  return await res.json();
}

export async function fetchPatentReport(documentId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/report`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to generate patent report');
  return await res.json();
}

