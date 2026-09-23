'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Send, Cpu, FileText, Globe, CheckCircle2, Layers } from 'lucide-react';
import { ChatQueryResponse, DocumentItem } from '@/lib/types';
import { sendChatQuery } from '@/lib/api';

interface ChatInterfaceProps {
  selectedDocId?: string;
  documents?: DocumentItem[];
  activeConversationId?: string;
  onQueryResult: (result: ChatQueryResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ChatInterface({
  selectedDocId,
  documents = [],
  activeConversationId,
  onQueryResult,
  isLoading,
  setIsLoading,
}: ChatInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [useAgent, setUseAgent] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const handleQuerySubmit = async (qText?: string) => {
    const targetQ = qText || question;
    if (!targetQ.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await sendChatQuery(targetQ, selectedDocId, activeConversationId, useAgent);
      onQueryResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing query.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioClick = (scenarioText: string) => {
    setQuestion(scenarioText);
    handleQuerySubmit(scenarioText);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ask Patent Intelligence</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Query selected patent specification or cross-reference live EPO database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Document Indicator Badge */}
          {selectedDoc ? (
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[150px]">{selectedDoc.filename}</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>All Vault Documents</span>
            </div>
          )}

          {/* Agentic RAG Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Cpu className={`w-3.5 h-3.5 ${useAgent ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-[11px] font-bold text-slate-700">Agentic RAG</span>
            <button
              type="button"
              onClick={() => setUseAgent(!useAgent)}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                useAgent ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform shadow-2xs ${
                  useAgent ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            selectedDoc
              ? `Ask a question about ${selectedDoc.filename} (e.g., "Give me a basic overview of this patent")...`
              : 'Ask a question about your uploaded patent files or search live patent specs...'
          }
          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 font-medium transition shadow-2xs resize-none pr-12 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuerySubmit();
            }
          }}
        />

        <button
          onClick={() => handleQuerySubmit()}
          disabled={isLoading || !question.trim()}
          className="absolute right-3 bottom-3.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition shadow-2xs flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Demonstration Scenarios */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Recommended Patent Query Scenarios:
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleScenarioClick('Give me a basic overview of this patent document.')}
            className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 text-xs transition space-y-1 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-700 text-[11px] uppercase tracking-wider">
                Scenario 1 (Doc Overview)
              </span>
              <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-slate-700 font-medium text-[11px] leading-tight">
              "Give me a basic overview of this patent document."
            </p>
          </button>

          <button
            onClick={() => handleScenarioClick('Is this patent currently active?')}
            className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-amber-50/60 hover:border-amber-300 text-xs transition space-y-1 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-700 text-[11px] uppercase tracking-wider">
                Scenario 2 (Legal Audit)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-slate-700 font-medium text-[11px] leading-tight">
              "Is this patent currently active?"
            </p>
          </button>

          <button
            onClick={() => handleScenarioClick('Compare this patent with recent EPO developments.')}
            className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-purple-50/60 hover:border-purple-300 text-xs transition space-y-1 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-700 text-[11px] uppercase tracking-wider">
                Scenario 3 (Multi-Source RAG)
              </span>
              <Layers className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-slate-700 font-medium text-[11px] leading-tight">
              "Compare this patent with recent developments."
            </p>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
