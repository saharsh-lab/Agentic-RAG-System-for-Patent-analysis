'use client';

import React, { useState } from 'react';
import { Search, Database, RefreshCw, User, Bell } from 'lucide-react';
import { NavView } from './Sidebar';
import { UserProfile } from '@/lib/types';

interface HeaderProps {
  currentView: NavView;
  dbStatus: string;
  user: UserProfile | null;
  onRefresh: () => void;
  onOpenAuth: () => void;
  onQuickSearch: (query: string) => void;
}

export default function Header({
  currentView,
  dbStatus,
  user,
  onRefresh,
  onOpenAuth,
  onQuickSearch,
}: HeaderProps) {
  const [searchInput, setSearchInput] = useState('');

  const getViewTitle = (view: NavView) => {
    switch (view) {
      case 'dashboard':
        return 'Research Overview & Activity';
      case 'patent_search':
        return 'Live European Patent Office (EPO) Search';
      case 'chat':
        return 'Ask Patent & Agentic RAG Workspace';
      case 'documents':
        return 'Document Vault & Vector Ingestion';
      case 'patent_overview':
        return 'Patent Technical Overview & Auto-Summary';
      case 'claim_analysis':
        return 'Independent & Dependent Claim Analysis';
      case 'patent_similarity':
        return 'Concept-Based Patent Similarity Search';
      case 'comparison':
        return 'Side-by-Side Patent Comparison Matrix';
      case 'report':
        return '11-Section Patent Intelligence Report';
      case 'analytics':
        return 'Hallucination & Factual Claim Audit';
      case 'evaluation':
        return 'Academic Benchmark Evaluation Suite';
      case 'settings':
        return 'Platform Settings & Configurations';
      default:
        return 'Patent Intelligence Platform';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickSearch(searchInput.trim());
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            {getViewTitle(currentView)}
          </h1>
          <p className="text-[11px] text-slate-500">
            Document-First Evidence Orchestration & EPO Patent Intelligence
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-md w-full mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Quick search patents (e.g. EP3819283, battery, quantum)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500 text-[11px]">DB:</span>
          <span
            className={`font-bold text-[11px] ${
              dbStatus === 'connected' ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {dbStatus}
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span className="font-semibold text-slate-800">{user.full_name || user.email}</span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
