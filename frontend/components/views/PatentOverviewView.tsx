'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, AlertCircle, CheckCircle2, Cpu, Wrench, Layers,
  ExternalLink, Sparkles, RefreshCw, ArrowRight, BookOpen
} from 'lucide-react';
import { DocumentItem, PatentSummary } from '@/lib/types';
import { fetchPatentSummary } from '@/lib/api';

interface PatentOverviewViewProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (id?: string) => void;
  onNavigate: (view: any) => void;
}

export default function PatentOverviewView({
  documents,
  selectedDocId,
  onSelectDoc,
  onNavigate,
}: PatentOverviewViewProps) {
  const [activeDocId, setActiveDocId] = useState<string>(selectedDocId || (documents[0]?.id || ''));
  const [summaryData, setSummaryData] = useState<{ metadata: any; summary: PatentSummary } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDocId) {
      setActiveDocId(selectedDocId);
    } else if (documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [selectedDocId, documents]);

  useEffect(() => {
    if (activeDocId) {
      loadSummary(activeDocId);
    }
  }, [activeDocId]);

  const loadSummary = async (docId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatentSummary(docId);
      setSummaryData({
        metadata: data.metadata || {},
        summary: data.summary as PatentSummary || null
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load patent summary.');
    } finally {
      setLoading(false);
    }
  };

  const currentDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="space-y-6">
      {/* Header & Document Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Patent Technical Overview & Auto-Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically extracted bibliographic metadata, section breakdown, and grounded 8-point technical summary.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Selected Patent:</span>
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
                    {d.filename} ({d.file_type.toUpperCase()})
                  </option>
                ))}
              </select>
              <button
                onClick={() => activeDocId && loadSummary(activeDocId)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                title="Refresh summary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Patent Documents Uploaded</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload a patent PDF, DOCX, or TXT document in the Document Vault to generate an automatic technical overview.
          </p>
          <button
            onClick={() => onNavigate('documents')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
          >
            Go to Document Vault
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Generating grounded 8-point patent summary...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-700 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Summary Generation Error
          </div>
          <p>{error}</p>
        </div>
      ) : summaryData?.summary ? (
        <>
          {/* Bibliographic Metadata Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Bibliographic Metadata
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Title</span>
                <span className="font-bold text-slate-900 leading-snug">
                  {summaryData.metadata?.title || currentDoc?.filename}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Publication Number</span>
                <span className="font-mono font-bold text-blue-700">
                  {summaryData.metadata?.publication_number || 'DOC-' + activeDocId.slice(0, 8)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Inventors</span>
                <span className="text-slate-800 font-medium">
                  {summaryData.metadata?.inventors?.join(', ') || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Assignee / Applicant</span>
                <span className="text-slate-800 font-medium">
                  {summaryData.metadata?.applicants?.join(', ') || 'Disclosed Assignee'}
                </span>
              </div>
            </div>
          </div>

          {/* 8-Point Structured Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Overview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                1. Patent Overview
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {summaryData.summary.overview}
              </p>
            </div>

            {/* 2. Problem Being Solved */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                2. Problem Being Solved
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {summaryData.summary.problem_solved}
              </p>
            </div>

            {/* 3. Proposed Solution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                3. Proposed Solution
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {summaryData.summary.proposed_solution}
              </p>
            </div>

            {/* 4. Main Technologies Used */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                4. Main Technologies Used
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {summaryData.summary.main_technologies?.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Key Components */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-slate-700" />
                5. Key Technical Components
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                {summaryData.summary.key_components?.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* 6. Important Claims */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                6. Core Claims Disclosed
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5">
                {summaryData.summary.important_claims?.map((claim, i) => (
                  <li key={i} className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px]">
                    {claim}
                  </li>
                ))}
              </ul>
            </div>

            {/* 7. Advantages */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                7. Technical Advantages
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                {summaryData.summary.advantages?.map((adv, i) => (
                  <li key={i} className="text-emerald-800">{adv}</li>
                ))}
              </ul>
            </div>

            {/* 8. Limitations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                8. Limitations & Boundaries
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                {summaryData.summary.limitations?.map((lim, i) => (
                  <li key={i} className="text-amber-800">{lim}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-blue-900">
              Continue researching with this patent:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate('claim_analysis')}
                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100/60 transition shadow-2xs"
              >
                Analyze Claims →
              </button>
              <button
                onClick={() => onNavigate('patent_similarity')}
                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100/60 transition shadow-2xs"
              >
                Find Similar Patents →
              </button>
              <button
                onClick={() => onNavigate('report')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-2xs"
              >
                Generate Full Report →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
