'use client';

import React, { useState } from 'react';
import { Search, Filter, Globe, ExternalLink, Eye, Bookmark, GitCompare, Database, CheckCircle2 } from 'lucide-react';
import { searchPatents } from '@/lib/api';
import { PatentItem } from '@/lib/types';

interface PatentSearchViewProps {
  onSelectPatentForDetail: (patent: PatentItem) => void;
  onAddPatentToComparison: (patent: PatentItem) => void;
}

export default function PatentSearchView({
  onSelectPatentForDetail,
  onAddPatentToComparison,
}: PatentSearchViewProps) {
  const [query, setQuery] = useState('solid-state battery thermal management');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('ALL');
  const [limit, setLimit] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PatentItem[] | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [savedPatentNums, setSavedPatentNums] = useState<Set<string>>(new Set());

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await searchPatents(query.trim(), limit);
      setSearchResults(res.results);
      setTotalResults(res.total_results);
    } catch (err) {
      console.error('Patent search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSavePatent = (num: string) => {
    setSavedPatentNums((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const filteredResults = searchResults
    ? searchResults.filter((p) => {
        if (jurisdictionFilter === 'ALL') return true;
        return p.publication_number.startsWith(jurisdictionFilter);
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Search Input Box & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, IPC code, assignee, or publication number (e.g. EP3819283)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition flex items-center gap-2"
          >
            {isSearching ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Search EPO OPS</span>
          </button>
        </form>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Jurisdiction:
            </span>
            {['ALL', 'EP', 'US', 'WO', 'DE'].map((j) => (
              <button
                key={j}
                onClick={() => setJurisdictionFilter(j)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                  jurisdictionFilter === j
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {j === 'ALL' ? 'All Offices' : j}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Result Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800"
            >
              <option value={5}>5 records</option>
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      {searchResults && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
          <span>
            Found <strong className="text-slate-900">{totalResults.toLocaleString()}</strong> patent matches in official EPO database
          </span>
          <span>Showing {filteredResults?.length || 0} results</span>
        </div>
      )}

      {/* Search Results Hybrid List/Table */}
      {isSearching ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Querying European Patent Office REST API...</p>
        </div>
      ) : !searchResults ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <Database className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">Execute Patent Intelligence Search</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Search live patent specifications, assignees, legal status, and classification codes across EP, US, and WIPO databases.
          </p>
        </div>
      ) : filteredResults?.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          No patent records found matching jurisdiction filter '{jurisdictionFilter}'.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults?.map((patent) => {
            const isSaved = savedPatentNums.has(patent.publication_number);
            return (
              <div
                key={patent.publication_number}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                        {patent.publication_number}
                      </span>
                      {patent.legal_status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {patent.legal_status}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        Source: {patent.source}
                      </span>
                    </div>

                    <h4
                      onClick={() => onSelectPatentForDetail(patent)}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition leading-snug"
                    >
                      {patent.title || `Patent Specifications for ${patent.publication_number}`}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleSavePatent(patent.publication_number)}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        isSaved
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={isSaved ? 'Saved to Workspace' : 'Save to Workspace'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onAddPatentToComparison(patent)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs transition"
                      title="Add to Patent Comparison Matrix"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectPatentForDetail(patent)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Specs</span>
                    </button>
                  </div>
                </div>

                {patent.abstract && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-2.5 rounded-md border border-slate-100">
                    {patent.abstract}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                  <div className="flex items-center gap-3">
                    {patent.applicants && patent.applicants.length > 0 && (
                      <span>Assignee: <strong className="text-slate-700">{patent.applicants.join(', ')}</strong></span>
                    )}
                    {patent.publication_date && <span>Pub Date: {patent.publication_date}</span>}
                  </div>

                  {patent.source_url && (
                    <a
                      href={patent.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                    >
                      <span>Espacenet Registry</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
