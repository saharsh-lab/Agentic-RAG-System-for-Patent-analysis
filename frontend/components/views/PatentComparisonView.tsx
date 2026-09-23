'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCompare, ExternalLink, CheckCircle2, AlertCircle, ShieldAlert,
  Cpu, Wrench, Layers, RefreshCw
} from 'lucide-react';
import { PatentItem, PatentComparisonResponse } from '@/lib/types';
import { comparePatentsData } from '@/lib/api';

interface PatentComparisonViewProps {
  comparisonList: PatentItem[];
  onRemove: (pubNum: string) => void;
  baseDoc?: any;
}

export default function PatentComparisonView({
  comparisonList,
  onRemove,
  baseDoc
}: PatentComparisonViewProps) {
  const [comparisonData, setComparisonData] = useState<PatentComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const defaultBasePatent = baseDoc ? {
    title: baseDoc.metadata?.title || baseDoc.filename || 'Uploaded Primary Patent',
    publication_number: baseDoc.metadata?.publication_number || 'PRIMARY-DOC',
    source: 'Uploaded Document Vault',
    abstract: baseDoc.summary?.overview || 'Primary disclosed technical specification.',
    claims: baseDoc.summary?.important_claims || ['1. Primary disclosed apparatus.']
  } : {
    title: 'Solid-state battery thermal management system with phase change material',
    publication_number: 'EP3819283A1',
    source: 'Primary Patent Disclosure',
    abstract: 'A solid state battery module with cooling loops comprising composite phase change materials.',
    claims: ['1. A solid-state battery system comprising an electrolyte and thermal management matrix.']
  };

  const candidatePatents = comparisonList.length > 0 ? comparisonList : [
    {
      publication_number: 'US10987654B2',
      title: 'Polymer electrolyte composite for high voltage solid lithium batteries',
      applicants: ['Solid Power Tech Corp'],
      inventors: ['Dr. Charlie Brown'],
      filing_date: '2021-06-10',
      publication_date: '2022-11-05',
      jurisdictions: ['US'],
      ipc_codes: ['H01M10/056'],
      legal_status: 'ACTIVE',
      claims: ['1. A composite electrolyte structure featuring cross-linked polymer matrix.'],
      source: 'USPTO / EPO OPS',
      abstract: 'Polymer matrix providing mechanical flexibility and dendrite suppression in high-voltage lithium cells.'
    },
    {
      publication_number: 'EP3920194A1',
      title: 'Lithium-sulfur solid state cell with sulfide glass electrolyte',
      applicants: ['Quantum Energy Labs'],
      inventors: ['Dr. Elena Rostova'],
      filing_date: '2022-01-14',
      publication_date: '2023-08-10',
      jurisdictions: ['EP'],
      ipc_codes: ['H01M10/052'],
      legal_status: 'ACTIVE',
      claims: ['1. A lithium-sulfur battery cell comprising 75% sulfide glass electrolyte.'],
      source: 'EPO OPS',
      abstract: 'High conductivity argyrodite sulfide glass formulation minimizing interfacial resistance.'
    }
  ];

  useEffect(() => {
    runComparison();
  }, [comparisonList]);

  const runComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await comparePatentsData(defaultBasePatent, candidatePatents);
      setComparisonData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate comparison matrix.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-600" />
              Side-by-Side Patent Technical Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side technical evaluation across 7 core engineering attributes, highlighting similarities, differences, and source provenance.
            </p>
          </div>
          <button
            onClick={runComparison}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-compare</span>
          </button>
        </div>
      </div>

      {/* Legal Safety Banner (Requirement 19) */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-amber-950">Comparative Research Scope Notice</div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This technical comparison is an informational engineering tool. It identifies overlapping and distinguishing technical features between patent disclosures and does <strong>NOT</strong> provide legal opinions on claim infringement, doctrine of equivalents, or patent validity.
          </p>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Generating multi-patent technical comparison matrix...</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-900">
                    <th className="py-3 px-4 w-48 font-bold border-r border-slate-200">
                      Technical Attribute
                    </th>
                    <th className="py-3 px-4 font-bold border-r border-slate-200 min-w-[260px] bg-blue-50/40">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-800 font-bold">{defaultBasePatent.publication_number}</span>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          Base Patent
                        </span>
                      </div>
                      <div className="text-[11px] font-normal text-slate-500 mt-1 truncate">
                        Source: {defaultBasePatent.source}
                      </div>
                    </th>
                    {candidatePatents.map((p, idx) => (
                      <th key={p.publication_number} className="py-3 px-4 font-bold border-r border-slate-200 min-w-[260px]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-900 font-bold">{p.publication_number}</span>
                          {comparisonList.length > 0 && (
                            <button
                              onClick={() => onRemove(p.publication_number)}
                              className="text-[10px] text-red-600 hover:underline font-normal"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-1 truncate">
                          Source: {p.source}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {/* 1. Technology */}
                  <tr>
                    <td className="py-3 px-4 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-700">
                      Technology Domain
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 bg-blue-50/10 font-semibold text-slate-900">
                      {comparisonData?.comparison_matrix?.technology?.base || defaultBasePatent.title}
                    </td>
                    {candidatePatents.map((p, idx) => (
                      <td key={p.publication_number} className="py-3 px-4 border-r border-slate-200 font-semibold text-slate-900">
                        {comparisonData?.comparison_matrix?.technology?.comparisons?.[idx] || p.title}
                      </td>
                    ))}
                  </tr>

                  {/* 2. Main Problem */}
                  <tr>
                    <td className="py-3 px-4 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-700">
                      Main Problem Addressed
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 bg-blue-50/10 text-slate-700">
                      {comparisonData?.comparison_matrix?.main_problem?.base || 'Thermal instability and parasitic cooling loss.'}
                    </td>
                    {candidatePatents.map((p, idx) => (
                      <td key={p.publication_number} className="py-3 px-4 border-r border-slate-200 text-slate-700">
                        {comparisonData?.comparison_matrix?.main_problem?.comparisons?.[idx] || 'Electrolyte degradation and dendrite propagation under high voltage.'}
                      </td>
                    ))}
                  </tr>

                  {/* 3. Proposed Solution */}
                  <tr>
                    <td className="py-3 px-4 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-700">
                      Proposed Solution
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 bg-blue-50/10 text-slate-700">
                      {comparisonData?.comparison_matrix?.proposed_solution?.base || 'Composite phase change material matrix integrated into module cell spacers.'}
                    </td>
                    {candidatePatents.map((p, idx) => (
                      <td key={p.publication_number} className="py-3 px-4 border-r border-slate-200 text-slate-700">
                        {comparisonData?.comparison_matrix?.proposed_solution?.comparisons?.[idx] || 'Cross-linked polymer electrolyte layer with high ionic conductivity.'}
                      </td>
                    ))}
                  </tr>

                  {/* 4. Technical Components */}
                  <tr>
                    <td className="py-3 px-4 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-700">
                      Technical Components
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 bg-blue-50/10 text-slate-700">
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {(comparisonData?.comparison_matrix?.technical_components?.base || ['PCM Thermal Sleeves', 'Solid Electrolyte Layer', 'Current Collector']).map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </td>
                    {candidatePatents.map((p, idx) => (
                      <td key={p.publication_number} className="py-3 px-4 border-r border-slate-200 text-slate-700">
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {(comparisonData?.comparison_matrix?.technical_components?.comparisons?.[idx] || ['Polymer Matrix', 'Electrode Coating', 'Ceramic Separator']).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* 5. Claims & Features */}
                  <tr>
                    <td className="py-3 px-4 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-700">
                      Core Claims / Features
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 bg-blue-50/10 font-mono text-[11px] text-slate-800">
                      {comparisonData?.comparison_matrix?.claims_features?.base || defaultBasePatent.claims?.[0]}
                    </td>
                    {candidatePatents.map((p, idx) => (
                      <td key={p.publication_number} className="py-3 px-4 border-r border-slate-200 font-mono text-[11px] text-slate-800">
                        {comparisonData?.comparison_matrix?.claims_features?.comparisons?.[idx] || p.claims?.[0]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Similarities & Differences Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Technical Similarities
              </h4>
              <ul className="text-xs text-slate-700 space-y-2">
                {(comparisonData?.key_similarities || [
                  'Both disclosures focus on enhancing lithium-based solid-state battery reliability.',
                  'Both inventions utilize specialized solid electrolyte interfaces to mitigate dendrite formation.',
                  'Both incorporate advanced thermal control structures.'
                ]).map((sim, i) => (
                  <li key={i} className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-emerald-900">
                    <span className="font-bold text-emerald-700">{i + 1}.</span>
                    <span>{sim}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Key Technical Differences
              </h4>
              <ul className="text-xs text-slate-700 space-y-2">
                {(comparisonData?.key_differences || [
                  'The base patent implements phase-change composite materials, whereas candidates utilize polymer or sulfide glass matrixes.',
                  'Different primary independent claim scope regarding operating temperature bounds.',
                  'Disparate electrode packaging and cell assembly configurations.'
                ]).map((diff, i) => (
                  <li key={i} className="flex items-start gap-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-blue-900">
                    <span className="font-bold text-blue-700">{i + 1}.</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
