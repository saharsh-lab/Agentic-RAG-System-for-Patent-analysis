'use client';

import React from 'react';
import { FileText, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { DocumentItem } from '@/lib/types';
import { deleteDocumentFile } from '@/lib/api';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (docId?: string) => void;
  onDocumentDeleted: (docId: string) => void;
}

export default function DocumentList({
  documents,
  selectedDocId,
  onSelectDoc,
  onDocumentDeleted,
}: DocumentListProps) {
  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDocumentFile(docId);
      onDocumentDeleted(docId);
    } catch (err) {
      console.error('Delete document failed:', err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Document Repository ({documents.length})
          </h3>
        </div>
        {selectedDocId && (
          <button
            onClick={() => onSelectDoc(undefined)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
          >
            Clear Selection
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic">
          No patent documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {documents.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-xs">{doc.filename}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {doc.chunk_count} chunks • {(doc.file_size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
