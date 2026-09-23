'use client';

import React from 'react';
import {
  FileText, Search, MessageSquare, ShieldCheck, ArrowRight, Layers, Database, Activity, Plus
} from 'lucide-react';
import { DocumentItem, ConversationSummary, PatentItem } from '@/lib/types';

interface DashboardViewProps {
  documents: DocumentItem[];
  conversations: ConversationSummary[];
  recentPatents: PatentItem[];
  onNavigate: (view: any) => void;
  onSelectDoc: (id?: string) => void;
  onSelectConversation: (id: string) => void;
}

export default function DashboardView({
  documents,
  conversations,
  recentPatents,
  onNavigate,
  onSelectDoc,
  onSelectConversation,
}: DashboardViewProps) {
  const totalQueries = conversations.reduce((sum, c) => sum + c.query_count, 0);

  return (
    <div className="space-y-6">
      {/* Subtle Statistics Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Documents Analyzed</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{documents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Indexed in vector store</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Patents Discovered</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">2,009,397+</div>
          <div className="text-[11px] text-slate-500 mt-1">Live EPO OPS search records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Research Threads</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{conversations.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Saved active conversations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Queries Executed</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalQueries}</div>
          <div className="text-[11px] text-slate-500 mt-1">Claim-level evidence passes</div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Quick Research Actions
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-blue-900 hover:bg-blue-100/60 transition font-semibold"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Ask Documents (RAG)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <button
            onClick={() => onNavigate('patent_search')}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 transition font-semibold"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-600" />
              Search EPO Database
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 transition font-semibold"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              Upload Patent File
            </span>
            <Plus className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 transition font-semibold"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Hallucination Audit
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Documents & Recent Threads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Recently Uploaded Documents
            </h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
            >
              View Vault ({documents.length})
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No documents in vault yet. Upload a PDF/DOCX patent file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Filename</th>
                    <th className="py-2 px-3">Chunks</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[200px]">
                        {doc.filename}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{doc.chunk_count}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{(doc.file_size / 1024).toFixed(0)} KB</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => { onSelectDoc(doc.id); onNavigate('chat'); }}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                        >
                          Query
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Saved Conversations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Active Research Sessions
            </h3>
            <button
              onClick={() => onNavigate('chat')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
            >
              Open Workspace
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No saved conversations yet.
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => { onSelectConversation(conv.id); onNavigate('chat'); }}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300 cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{conv.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {conv.query_count} queries • {new Date(conv.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
