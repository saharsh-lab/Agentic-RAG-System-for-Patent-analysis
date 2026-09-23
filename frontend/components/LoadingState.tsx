'use client';

import React from 'react';
import { Cpu, Search, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Executing Agentic RAG Research Workflow
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating document sufficiency, retrieving hybrid evidence, and performing claim grounding check...
        </p>
      </div>

      <div className="max-w-md mx-auto grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-medium">
        <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Intent Check</span>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Hybrid Vector</span>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span>Sufficiency</span>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Claim Audit</span>
        </div>
      </div>
    </div>
  );
}
