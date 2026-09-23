'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Printer, ShieldAlert, CheckCircle2,
  FileText, Sparkles, RefreshCw, BookOpen, Layers, ExternalLink
} from 'lucide-react';
import { DocumentItem, PatentReportResponse } from '@/lib/types';
import { fetchPatentReport } from '@/lib/api';

interface ReportViewProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (id?: string) => void;
}

export default function ReportView({
  documents,
  selectedDocId,
  onSelectDoc,
}: ReportViewProps) {
  const [activeDocId, setActiveDocId] = useState<string>(selectedDocId || (documents[0]?.id || ''));
  const [reportData, setReportData] = useState<PatentReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDocId) setActiveDocId(selectedDocId);
    else if (documents.length > 0 && !activeDocId) setActiveDocId(documents[0].id);
  }, [selectedDocId, documents]);

  useEffect(() => {
    if (activeDocId) {
      loadReport(activeDocId);
    }
  }, [activeDocId]);

  const loadReport = async (docId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatentReport(docId);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!reportData) return;
    const blob = new Blob([reportData.markdown_content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Patent_Intelligence_Report_${reportData.filename.replace(/\.[^/.]+$/, '')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const s = reportData?.report_sections || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              11-Section Patent Intelligence Research Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive academic research synthesis combining document disclosures, claim structures, prior art similarity, and multi-source evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {documents.length > 0 && (
              <select
                value={activeDocId}
                onChange={(e) => {
                  setActiveDocId(e.target.value);
                  onSelectDoc(e.target.value);
                }}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => activeDocId && loadReport(activeDocId)}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Regenerate Report"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {reportData && (
              <>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
          Upload a patent document first to generate an intelligence report.
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Compiling 11-section research report...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-700">
          {error}
        </div>
      ) : reportData ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-8 printable-report">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Patent Intelligence Technical Report
            </span>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              {s.section_1_overview?.patent_title || reportData.filename}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
              <span>Publication: <strong className="text-slate-800 font-mono">{s.section_1_overview?.publication_number || 'N/A'}</strong></span>
              <span>Date: <strong className="text-slate-800">{s.section_1_overview?.publication_date || 'N/A'}</strong></span>
              <span>Document File: <strong className="text-slate-800">{reportData.filename}</strong></span>
            </div>
          </div>

          {/* Legal Safety Notice (Requirement 19) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed">
            ⚖️ <strong>Legal Disclaimer</strong>: {s.section_11_references?.disclaimer}
          </div>

          {/* Section 1: Overview */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              1. Patent Overview
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {s.section_1_overview?.summary}
            </p>
          </div>

          {/* Section 2: Problem Statement */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              2. Problem Statement
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {s.section_2_problem?.problem_description}
            </p>
          </div>

          {/* Section 3: Proposed Solution */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              3. Proposed Solution
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {s.section_3_solution?.solution_description}
            </p>
          </div>

          {/* Section 4: Technical Components */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              4. Technical Components
            </h2>
            <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
              {s.section_4_components?.components?.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Section 5: Claim Analysis */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              5. Claim Analysis
            </h2>
            <div className="text-xs text-slate-700 space-y-2">
              <p>
                Total claims detected: <strong>{s.section_5_claims?.total_claims || 0}</strong> ({s.section_5_claims?.independent_claims?.length || 0} Independent, {s.section_5_claims?.dependent_claims?.length || 0} Dependent).
              </p>
              <div className="space-y-1.5">
                {s.section_5_claims?.important_claims?.map((ic: string, i: number) => (
                  <div key={i} className="p-2.5 rounded bg-slate-50 border border-slate-200 font-mono text-[11px]">
                    {ic}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Similar Patents */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              6. Similar Patents & Prior Art Landscape
            </h2>
            <div className="space-y-2">
              {s.section_6_similar_patents?.patents?.map((p: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{p.publication_number}: {p.title}</span>
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                      Retrieval Score: {(p.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600"><em>Reason:</em> {p.retrieval_reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Patent Comparison */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              7. Patent Comparison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="font-bold text-emerald-900 block mb-1">Key Similarities:</span>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px]">
                  {s.section_7_comparison?.similarities?.map((sim: string, i: number) => (
                    <li key={i}>{sim}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-900 block mb-1">Key Differences:</span>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-[11px]">
                  {s.section_7_comparison?.differences?.map((diff: string, i: number) => (
                    <li key={i}>{diff}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 8: External Research */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              8. External Research & Academic Literature
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {s.section_8_external_research?.notes}
            </p>
          </div>

          {/* Section 9: Evidence & Source Provenance */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              9. Evidence & Source Provenance
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {s.section_9_evidence?.provenance_statement} (Indexed from <code>{reportData.filename}</code>).
            </p>
          </div>

          {/* Section 10: Limitations */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              10. Advantages & Limitations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Advantages:</span>
                <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-1">
                  {s.section_10_limitations?.advantages?.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-1">Limitations:</span>
                <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-1">
                  {s.section_10_limitations?.limitations?.map((l: string, i: number) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 11: References */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
              11. References
            </h2>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 text-[11px]">
              {s.section_11_references?.references?.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
