'use client';

import React from 'react';
import { History, Search, ArrowRight, Clock } from 'lucide-react';
import { ConversationSummary } from '@/lib/types';

interface SearchHistoryViewProps {
  conversations: ConversationSummary[];
  onSelectConversation: (id: string) => void;
  onNavigate: (view: any) => void;
}

export default function SearchHistoryView({
  conversations,
  onSelectConversation,
  onNavigate,
}: SearchHistoryViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Search & Research Query History
        </h3>
        <p className="text-xs text-slate-500">
          Complete audit trail of user questions, intent classifications, and evidence passes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {conversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No search history recorded yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Research Query / Title</th>
                <th className="py-3 px-4">Document Context</th>
                <th className="py-3 px-4">Queries</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.document_name || 'Global Research'}</td>
                  <td className="py-3.5 px-4 font-mono">{c.query_count} Qs</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{new Date(c.updated_at).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => { onSelectConversation(c.id); onNavigate('chat'); }}
                      className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition inline-flex items-center gap-1"
                    >
                      <span>Re-open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
