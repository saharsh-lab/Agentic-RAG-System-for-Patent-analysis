'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { ClaimVerificationItem } from '@/lib/types';

interface ClaimVerificationProps {
  verifications: ClaimVerificationItem[];
}

export default function ClaimVerification({ verifications }: ClaimVerificationProps) {
  if (!verifications || verifications.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified Supported
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Partially Supported
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Unsupported / Hallucinated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Uncertain
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Claim-Level Factual Audit ({verifications.length} Statements)
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {verifications.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">
                Claim {idx + 1}
              </span>

              <div className="flex items-center gap-2">
                {getStatusBadge(item.status)}
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  {(item.confidence * 100).toFixed(0)}% Conf.
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              "{item.claim_text}"
            </p>

            {item.explanation && (
              <p className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 italic">
                {item.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
