'use client';

import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle,
  Cpu, BookOpen, Layers, ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';
import { DocumentItem, PatentClaim, ClaimAnalysisResult } from '@/lib/types';
import { fetchPatentClaims, analyzePatentClaim } from '@/lib/api';

interface ClaimAnalysisViewProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (id?: string) => void;
  onNavigate: (view: any) => void;
}

export default function ClaimAnalysisView({
  documents,
  selectedDocId,
  onSelectDoc,
  onNavigate,
}: ClaimAnalysisViewProps) {
  const [activeDocId, setActiveDocId] = useState<string>(selectedDocId || (documents[0]?.id || ''));
  const [claimsData, setClaimsData] = useState<{ total_claims: number; independent_claims_count: number; dependent_claims_count: number; claims: PatentClaim[] } | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<PatentClaim | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ClaimAnalysisResult | null>(null);
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDocId) setActiveDocId(selectedDocId);
    else if (documents.length > 0 && !activeDocId) setActiveDocId(documents[0].id);
  }, [selectedDocId, documents]);

  useEffect(() => {
    if (activeDocId) {
      loadClaims(activeDocId);
    }
  }, [activeDocId]);

  const loadClaims = async (docId: string) => {
    setLoadingClaims(true);
    setError(null);
    setSelectedClaim(null);
    setAnalysisResult(null);
    try {
      const data = await fetchPatentClaims(docId);
      setClaimsData(data);
      if (data.claims && data.claims.length > 0) {
        setSelectedClaim(data.claims[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load claims.');
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleAnalyze = async (action: string = 'all') => {
    if (!selectedClaim || !activeDocId) return;
    setAnalyzing(true);
    setSelectedAction(action);
    setError(null);
    try {
      const res = await analyzePatentClaim(
        activeDocId,
        selectedClaim.claim_number,
        selectedClaim.claim_text,
        selectedClaim.claim_type,
        action
      );
      setAnalysisResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze claim.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Patent Claim Deconstruction & Analysis Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any independent or dependent claim to translate legal language into plain English, isolate components, and cite supporting disclosure pages.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Patent File:</span>
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

        {/* Claim Statistics Bar */}
        {claimsData && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">
              Total Claims: <strong className="text-slate-900">{claimsData.total_claims}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Independent: {claimsData.independent_claims_count}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Dependent: {claimsData.dependent_claims_count}
            </span>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <Award className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Patent Document Selected</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload a patent document first to analyze its independent and dependent claim structure.
          </p>
        </div>
      ) : loadingClaims ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Parsing and classifying patent claims...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Claim Selector List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 lg:col-span-1">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Claims Index</span>
              <span className="text-slate-400 font-normal">{claimsData?.claims.length || 0} claims</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {claimsData?.claims.map((claim) => {
                const isSelected = selectedClaim?.claim_number === claim.claim_number;
                return (
                  <button
                    key={claim.claim_number}
                    onClick={() => {
                      setSelectedClaim(claim);
                      setAnalysisResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-slate-900 font-mono">
                        Claim {claim.claim_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        claim.is_independent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {claim.claim_type}
                      </span>
                    </div>
                    {claim.parent_claim && (
                      <span className="text-[10px] text-slate-400 block mb-1">
                        ↳ Depends on Claim {claim.parent_claim}
                      </span>
                    )}
                    <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                      {claim.claim_text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Claim Inspection & Analysis Panel */}
          <div className="lg:col-span-2 space-y-5">
            {selectedClaim ? (
              <>
                {/* Original Claim Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Claim {selectedClaim.claim_number} ({selectedClaim.claim_type})
                    </span>
                    {selectedClaim.parent_claim && (
                      <span className="text-xs font-semibold text-slate-500">
                        Dependent on Claim {selectedClaim.parent_claim}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedClaim.claim_text}
                  </div>

                  {/* Predefined Action Trigger Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Execute Claim Analysis:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAnalyze('explain_simple')}
                        disabled={analyzing}
                        className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-semibold text-xs text-left transition disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 mb-1" />
                        <div>1. Plain English</div>
                        <div className="text-[10px] text-slate-500 font-normal">Explain in simple terms</div>
                      </button>

                      <button
                        onClick={() => handleAnalyze('technical_components')}
                        disabled={analyzing}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xs text-left transition disabled:opacity-50"
                      >
                        <Cpu className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                        <div>2. Technical Components</div>
                        <div className="text-[10px] text-slate-500 font-normal">Extract technical elements</div>
                      </button>

                      <button
                        onClick={() => handleAnalyze('supporting_patent_parts')}
                        disabled={analyzing}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xs text-left transition disabled:opacity-50"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                        <div>3. Supporting Evidence</div>
                        <div className="text-[10px] text-slate-500 font-normal">Find cited page sections</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis Output Section */}
                {analyzing ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-2xs space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      Analyzing Claim {selectedClaim.claim_number} & retrieving disclosure citations...
                    </p>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-4">
                    {/* Simplified Explanation */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Plain English Explanation
                      </h4>
                      <p className="text-xs text-slate-800 leading-relaxed bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                        {analysisResult.simplified_explanation}
                      </p>
                    </div>

                    {/* Technical Components */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                        Technical Components Disclosed
                      </h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                        {analysisResult.technical_components?.map((c, i) => (
                          <div key={i} className="p-3 bg-white text-xs flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-bold text-slate-900">{c.component}</span>
                            <span className="text-slate-600 text-[11px]">{c.function}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Supporting Disclosures & Page References */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Supporting Disclosures & Exact Page Citations
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.evidence_citations?.map((ev, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-emerald-800 font-mono">
                                Page {ev.page_number || 'N/A'} • {ev.section || 'Specification'}
                              </span>
                              <span className="text-slate-400">
                                Match Score: {(ev.similarity_score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              "{ev.content_snippet}..."
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
                Select a claim from the left index to begin analysis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
