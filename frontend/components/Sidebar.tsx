'use client';

import React from 'react';
import {
  LayoutDashboard, Search, MessageSquare, Layers,
  GitCompare, ShieldCheck, BarChart2, Settings, LogIn, LogOut, User, Cpu,
  FileText, Award, Compass, FileCheck2, FileSpreadsheet
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

export type NavView =
  | 'dashboard'
  | 'documents'
  | 'patent_overview'
  | 'chat'
  | 'claim_analysis'
  | 'patent_similarity'
  | 'comparison'
  | 'patent_search'
  | 'report'
  | 'evaluation'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
}: SidebarProps) {
  const primaryModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Document Vault', icon: Layers },
    { id: 'patent_overview', label: 'Patent Overview & Summary', icon: FileText },
    { id: 'chat', label: 'Ask Patent (Agentic RAG)', icon: MessageSquare },
    { id: 'claim_analysis', label: 'Claim Analysis', icon: Award },
  ];

  const searchModules = [
    { id: 'patent_similarity', label: 'Similar Patents', icon: Compass },
    { id: 'comparison', label: 'Patent Comparison Matrix', icon: GitCompare },
    { id: 'patent_search', label: 'Live EPO OPS Search', icon: Search },
  ];

  const academicModules = [
    { id: 'report', label: 'Patent Intelligence Report', icon: FileSpreadsheet },
    { id: 'evaluation', label: 'Benchmark Evaluation', icon: BarChart2 },
    { id: 'analytics', label: 'Hallucination Audit', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const renderNavList = (items: Array<{ id: string; label: string; icon: any }>) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as NavView)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 leading-none">PatentIntel AI</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Agentic Multi-Source Patent RAG</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Patent Intelligence
          </div>
          {renderNavList(primaryModules)}
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Similarity & Matrix
          </div>
          {renderNavList(searchModules)}
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Research & Verification
          </div>
          {renderNavList(academicModules)}
        </div>
      </nav>

      {/* Safety Notice in Sidebar */}
      <div className="px-3 py-2 bg-amber-50/70 border-t border-amber-200/60 text-[10px] text-amber-800 leading-tight">
        ⚖️ <strong>Academic Research Platform</strong>: Informational use only. Not legal advice or FTO clearance.
      </div>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-900 truncate">{user.full_name || user.email}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-600 p-1 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
}
