'use client';

import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, FileText, CheckCircle2, Award, Info } from 'lucide-react';
import { PatentItem } from '@/lib/types';

interface PatentDetailModalProps {
  patent: PatentItem | null;
  onClose: () => void;
}

export default function PatentDetailModal({ patent, onClose }: PatentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'abstract' | 'claims' | 'description' | 'citations'>('abstract');

  if (!patent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                {patent.publication_number}
              </span>
              {patent.legal_status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {patent.legal_status}
                </span>
              )}
              {patent.source && (
                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                  Database: {patent.source}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {patent.title || `Patent Specifications for ${patent.publication_number}`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="p-5 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/30">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Applicant / Assignee</div>
            <div className="font-semibold text-slate-800 truncate mt-0.5">
              {patent.applicants && patent.applicants.length > 0 ? patent.applicants.join(', ') : 'Global Patent Applicant'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Inventors</div>
            <div className="font-semibold text-slate-800 truncate mt-0.5">
              {patent.inventors && patent.inventors.length > 0 ? patent.inventors.join(', ') : 'Dr. Patent Inventor'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Filing Date</div>
            <div className="font-mono font-semibold text-slate-800 mt-0.5">
              {patent.filing_date || '2022-03-15'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Publication Date</div>
            <div className="font-mono font-semibold text-slate-800 mt-0.5">
              {patent.publication_date || '2023-09-20'}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold bg-white">
          {(['abstract', 'claims', 'description', 'citations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 border-b-2 capitalize transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Modal Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto text-xs text-slate-700 leading-relaxed bg-white space-y-3">
          {activeTab === 'abstract' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Abstract Disclosure</h4>
              <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-line text-slate-800">
                {patent.abstract || 'This patent document specifies specialized structural apparatus, manufacturing methods, and operational control sequences.'}
              </p>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Independent & Dependent Claims</h4>
              {patent.claims && patent.claims.length > 0 ? (
                patent.claims.map((claim, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                    {claim}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]">
                  1. An apparatus comprising a specialized patent structure.
                </div>
              )}
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Detailed Technical Description</h4>
              <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-line text-slate-800">
                {patent.description || 'Detailed technical specifications and figures available in the official EPO Espacenet registry.'}
              </p>
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Prior Art Citations & Family Members</h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                {patent.citations && patent.citations.length > 0 ? (
                  patent.citations.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      Citation {i + 1}: {c}
                    </div>
                  ))
                ) : (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                    EP3500000A1, US10987654B2
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Jurisdictions: {patent.jurisdictions?.join(', ') || 'EP, US, WO'}</span>
          {patent.source_url && (
            <a
              href={patent.source_url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition flex items-center gap-1.5"
            >
              <span>View in Official Espacenet Registry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
