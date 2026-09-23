'use client';

import React from 'react';
import { Bot, CheckCircle, AlertTriangle, RefreshCw, Cpu, Zap, GitCommit } from 'lucide-react';
import { ChatQueryResponse } from '@/lib/types';

interface AnswerCardProps {
  response: ChatQueryResponse;
}

export default function AnswerCard({ response }: AnswerCardProps) {
  const isAgentic = response.query_type !== 'BASIC_RAG';

  const getSufficiencyBadge = (status: string) => {
    if (status === 'SUFFICIENT') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          Document Evidence Sufficient
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        Escalated to External Patent Research
      </span>
    );
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-2xs space-y-4 transition ${
      isAgentic ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
    }`}>
      {/* Top Mode Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            isAgentic
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {isAgentic ? <Cpu className="w-4 h-4 text-blue-600" /> : <Zap className="w-4 h-4 text-slate-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isAgentic ? 'Agentic RAG Synthesized Findings' : 'Standard RAG Findings'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                isAgentic
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {isAgentic ? 'Agentic Mode' : 'Normal Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isAgentic
                ? 'LangGraph Multi-Step Graph Execution • Dynamic Planning • Claim Audit'
                : 'Direct Document Vector Retrieval • Single-Pass Embeddings'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
            {response.query_type}
          </span>
          {getSufficiencyBadge(response.evidence_sufficiency)}
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            {response.iteration_count} pass{response.iteration_count > 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Agentic Graph Reasoning Execution Trace */}
      {isAgentic && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-[11px] uppercase tracking-wider text-blue-800">Agentic Execution Trace:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-semibold">1. Intent ({response.query_type})</span>
            <span className="text-blue-400">→</span>
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-semibold">2. Hybrid Retrieval ({response.selected_sources.join(', ')})</span>
            <span className="text-blue-400">→</span>
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-semibold">3. Claim Verification</span>
          </div>
        </div>
      )}

      {/* Agent Research Trail Panel (Requirement 12) */}
      {isAgentic && response.research_trail && response.research_trail.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Agent Research Process Trail
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              Cycle {response.iteration_count} of max 3
            </span>
          </div>
          <div className="space-y-1 pl-1">
            {response.research_trail.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 font-mono">
                <span className="text-blue-600 font-bold">›</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Answer Content Box */}
      <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-lg border border-slate-200 font-sans">
        {response.answer}
      </div>

      {/* Orchestrated Sources */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
        <span className="font-semibold text-slate-700">Orchestrated Sources:</span>
        {response.selected_sources.map((src) => (
          <span key={src} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
            {src}
          </span>
        ))}
      </div>
    </div>
  );
}
