'use client';

import React, { useState } from 'react';
import { FolderKanban, FileText, Bookmark, Plus, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { DocumentItem, PatentItem } from '@/lib/types';

interface ResearchWorkspaceViewProps {
  documents: DocumentItem[];
  savedPatents: PatentItem[];
}

export default function ResearchWorkspaceView({ documents, savedPatents }: ResearchWorkspaceViewProps) {
  const [topic, setTopic] = useState('Solid-State Electrolyte Patent Landscape 2026');
  const [notes, setNotes] = useState(
    'Key findings:\n1. Core patents disclose thermal phase-change management.\n2. EPO prior art EP3819283 shows independent claim coverage over lithium-lanthanum-zirconium oxide (LLZO).\n3. Escalation to live EPO database confirmed active legal status.'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveNotes = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Topic Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition"
            />
          </div>

          <button
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
          >
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved Workspace' : 'Save Session'}</span>
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selected Documents & Patents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Attached Documents ({documents.length})</span>
            </h4>
            <div className="space-y-2">
              {documents.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No documents attached.</div>
              ) : (
                documents.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{d.filename}</span>
                    <span className="text-[10px] font-mono text-slate-500">{d.chunk_count} chunks</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Bookmarked Patents</span>
            </h4>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <div className="font-bold text-blue-700">EP3819283</div>
              <div className="text-[11px] text-slate-600 font-sans">Solid-state battery thermal management</div>
            </div>
          </div>
        </div>

        {/* Right Column: Research Notepad & AI Synthesis */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Researcher Notes & Evidence Journal
            </h4>
            <textarea
              rows={12}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600 leading-relaxed resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
