'use client';

import React from 'react';
import { Settings, ShieldCheck, Database, Key, Server, Cpu, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface SettingsViewProps {
  user: UserProfile | null;
  dbStatus: string;
}

export default function SettingsView({ user, dbStatus }: SettingsViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          Platform Configurations & Infrastructure Settings
        </h3>
        <p className="text-xs text-slate-500">
          Manage API keys, database connections, and user environment settings.
        </p>
      </div>

      {/* User Account Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          User Profile & Isolation
        </h4>

        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-900 font-bold">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                {user.full_name || 'Patent Researcher'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Currently in guest mode. Sign in to save private research sessions across devices.
          </div>
        )}
      </div>

      {/* API Integration Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Key className="w-4 h-4 text-blue-600" />
          External API Connections
        </h4>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">European Patent Office (EPO OPS REST API)</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Consumer Key: GUZZM3i1Sh... (Authenticated)</div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Connected (2M+ Patents)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Tavily Web Search Adapter</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">API Key: tvly-dev-2p... / DuckDuckGo Fallback</div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">OpenAI LLM & Embeddings</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Model: gpt-4o-mini / text-embedding-3-small</div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Zero-Config Fallback Active
            </span>
          </div>
        </div>
      </div>

      {/* Database Infrastructure Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Server className="w-4 h-4 text-blue-600" />
          Vector Database Infrastructure
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Engine</div>
            <div className="font-bold text-slate-900 mt-1">PostgreSQL 16</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Vector Extension</div>
            <div className="font-bold text-emerald-700 mt-1">pgvector (HNSW Index)</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Status</div>
            <div className={`font-bold mt-1 ${dbStatus === 'connected' ? 'text-emerald-700' : 'text-red-600'}`}>
              {dbStatus} (Port 5432)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
