'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass, Search, AlertCircle, ExternalLink, GitCompare,
  Cpu, ArrowRight, RefreshCw, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { DocumentItem, SimilarPatentResult } from '@/lib/types';
import { searchSimilarPatents } from '@/lib/api';

interface PatentSimilarityViewProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (id?: string) => void;
  onNavigate: (view: any) => void;
  onCompareWith: (patent: any) => void;
}

export default function PatentSimilarityView({
  documents,
  selectedDocId,
  onSelectDoc,
  onNavigate,
  onCompareWith,
}: PatentSimilarityViewProps) {
  const [activeDocId, setActiveDocId] = useState<string>(selectedDocId || (documents[0]?.id || ''));
  const [customQuery, setCustomQuery] = useState<string>('');
  const [extractedConcepts, setExtractedConcepts] = useState<string[]>([]);
  const [similarResults, setSimilarResults] = useState<SimilarPatentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDocId) setActiveDocId(selectedDocId);
    else if (documents.length > 0 && !activeDocId) setActiveDocId(documents[0].id);
  }, [selectedDocId, documents]);

  useEffect(() => {
    if (activeDocId) {
      handleSearch(activeDocId);
    }
  }, [activeDocId]);

  const handleSearch = async (docId?: string, query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchSimilarPatents(docId, query, 6);
      setExtractedConcepts(data.extracted_concepts || []);
      setSimilarResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search similar patents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Concept Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              Multi-Source Patent Similarity Search
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Extracts technical concepts and retrieves nearest patent disclosures from local vector storage and live EPO OPS database.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Source Patent:</span>
              <select
                value={activeDocId}
                onChange={(e) => {
                  setActiveDocId(e.target.value);
                  onSelectDoc(e.target.value);
                }}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Custom Query Refinement Bar */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Or search by technical concept (e.g. solid state battery sulfide glass dendrite suppression)..."
            className="flex-1 text-xs border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(undefined, customQuery)}
          />
          <button
            onClick={() => handleSearch(undefined, customQuery)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Extracted Technical Concepts Chips */}
        {extractedConcepts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-slate-500 text-[11px]">Extracted Inventive Concepts:</span>
            {extractedConcepts.map((concept, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Legal Disclaimer Banner (Requirement 4 & 19) */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-amber-950">Important Similarity & Legal Safety Disclaimer</div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            All scores displayed below are <strong>Retrieval Similarity Scores</strong> calculated using technical vector embeddings and keyword co-occurrence.
            They strictly measure mathematical text/concept similarity and do <strong>NOT</strong> represent legal similarity, prior art invalidation, patent infringement probability, or freedom-to-operate conclusions.
          </p>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Retrieving similar patents from local vault & EPO OPS...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-700 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Similarity Search Error
          </div>
          <p>{error}</p>
        </div>
      ) : similarResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {similarResults.map((patent, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-blue-700 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {patent.publication_number}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {patent.source}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {patent.title}
                </h4>

                {/* Retrieval Similarity Score Card */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500">{patent.score_type}:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {(patent.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* Reason for retrieval */}
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                    <strong className="text-slate-700">Reason:</strong> {patent.retrieval_reason}
                  </div>
                </div>

                <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                  {patent.abstract}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {patent.source_url ? (
                  <a
                    href={patent.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-semibold"
                  >
                    <span>View Official Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">Local Document</span>
                )}

                <button
                  onClick={() => {
                    onCompareWith(patent);
                    onNavigate('comparison');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <GitCompare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Compare in Matrix</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
          No similar patents retrieved. Try entering custom search terms above.
        </div>
      )}
    </div>
  );
}
