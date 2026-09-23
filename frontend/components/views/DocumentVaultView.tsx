'use client';

import React from 'react';
import { Layers, FileText, UploadCloud, CheckCircle2, Trash2, ShieldCheck } from 'lucide-react';
import UploadBox from '@/components/UploadBox';
import DocumentList from '@/components/DocumentList';
import { DocumentItem } from '@/lib/types';

interface DocumentVaultViewProps {
  documents: DocumentItem[];
  selectedDocId?: string;
  onSelectDoc: (id?: string) => void;
  onUploadSuccess: (doc: DocumentItem) => void;
  onDocumentDeleted: (id: string) => void;
}

export default function DocumentVaultView({
  documents,
  selectedDocId,
  onSelectDoc,
  onUploadSuccess,
  onDocumentDeleted,
}: DocumentVaultViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <UploadBox onUploadSuccess={onUploadSuccess} />
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Patent Parsing Engine Guarantee
            </h4>
            <p className="leading-relaxed">
              PDF/DOCX documents uploaded to the vault are parsed using PyMuPDF page-number preservation. Section headers (Claims, Abstract, Detailed Description) are extracted, and Page 1 metadata is anchored for retrieval.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={onSelectDoc}
            onDocumentDeleted={onDocumentDeleted}
          />
        </div>
      </div>
    </div>
  );
}
