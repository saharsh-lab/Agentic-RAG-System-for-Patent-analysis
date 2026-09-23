'use client';

import React from 'react';
import { FileText, Globe, Database } from 'lucide-react';
import { SourceCitation } from '@/lib/types';

interface SourcesPanelProps {
  citations: SourceCitation[];
}

export default function SourcesPanel({ citations }: SourcesPanelProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  const getSourceIcon = (filename: string) => {
    if (filename.includes('EPO Patent') || filename.includes('EPO')) {
      return <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    if (filename.includes('Web:')) {
      return <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Database className="w-4 h-4 text-blue-600" />
        Evidence Provenance & Sources ({citations.length})
      </h3>

      <div className="space-y-3">
        {citations.map((cit, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800 truncate">
                {getSourceIcon(cit.filename)}
                <span className="truncate">{cit.filename}</span>
              </div>

              {cit.page_number && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  Page {cit.page_number}
                </span>
              )}
            </div>

            <p className="text-slate-600 italic line-clamp-3 text-[11px] leading-relaxed">
              "{cit.content}"
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
              {cit.section ? <span>Section: {cit.section}</span> : <span>General</span>}
              <span>Relevance Score: {(cit.similarity_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
