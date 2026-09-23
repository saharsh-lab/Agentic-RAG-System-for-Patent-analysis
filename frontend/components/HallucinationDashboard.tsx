'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Award, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { HallucinationAnalytics } from '@/lib/types';

interface HallucinationDashboardProps {
  analytics: HallucinationAnalytics | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function HallucinationDashboard({
  analytics,
  isLoading,
  onRefresh,
}: HallucinationDashboardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Calculating claim-level evidence verification analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">No Factual Audit Data Available</h3>
        <p className="text-xs text-slate-500">
          Execute research queries in the RAG workspace to audit statement grounding in real-time.
        </p>
      </div>
    );
  }

  const {
    total_claims,
    supported_count,
    partially_supported_count,
    unsupported_count,
    support_rate,
    hallucination_rate,
    grounding_score,
    flagged_claims,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>Total Claims Evaluated</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{total_claims}</div>
          <div className="text-[11px] text-slate-500 mt-1">Atomic factual statements audited</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>Verified Support Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{support_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{supported_count} of {total_claims} claims backed by evidence</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>Grounding Score</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{grounding_score}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Weighted document fidelity index</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>Hallucination Rate</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600">{hallucination_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{unsupported_count} unverified / unsupported statements</div>
        </div>
      </div>

      {/* Verification Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Claim Grounding Breakdown
          </h3>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-md overflow-hidden flex">
          <div
            style={{ width: `${total_claims > 0 ? (supported_count / total_claims) * 100 : 100}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Supported: ${supported_count}`}
          />
          <div
            style={{ width: `${total_claims > 0 ? (partially_supported_count / total_claims) * 100 : 0}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Partially Supported: ${partially_supported_count}`}
          />
          <div
            style={{ width: `${total_claims > 0 ? (unsupported_count / total_claims) * 100 : 0}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`Unsupported: ${unsupported_count}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Supported ({supported_count})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Partially Supported ({partially_supported_count})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Unsupported / Hallucinated ({unsupported_count})
          </span>
        </div>
      </div>

      {/* Flagged Claims Trace Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Audit Log: Flagged & Unsupported Statements
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {flagged_claims.length} claims flagged
          </span>
        </div>

        {flagged_claims.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600/70" />
            <p className="font-semibold text-slate-700">100% Claim Verification Passed</p>
            <p className="text-slate-500">No hallucinated or unbacked statements detected in active research threads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Statement / Claim</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Query Context</th>
                  <th className="py-2.5 px-3">Verification Explanation</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flagged_claims.map((fc) => (
                  <tr key={fc.claim_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                      "{fc.claim_text}"
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          fc.status === 'UNSUPPORTED' || fc.status === 'UNCERTAIN'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {fc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate">
                      "{fc.question}"
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-sm">
                      {fc.explanation || 'Evidence passage insufficient to verify claim.'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono whitespace-nowrap">
                      {new Date(fc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
