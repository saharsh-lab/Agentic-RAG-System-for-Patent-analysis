'use client';

import React from 'react';
import { MessageSquare, Plus, Trash2, FileText, Clock } from 'lucide-react';
import { ConversationSummary } from '@/lib/types';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Saved Threads ({conversations.length})
          </h3>
        </div>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Thread</span>
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic">
          No saved research threads yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-medium'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold truncate text-xs">{conv.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>{conv.query_count} Qs</span>
                    {conv.document_name && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[80px] text-blue-600 flex items-center gap-0.5">
                          <FileText className="w-3 h-3 inline" />
                          {conv.document_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                  title="Delete Thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
