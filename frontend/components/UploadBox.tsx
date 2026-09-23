'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadDocumentFile } from '@/lib/api';
import { DocumentItem } from '@/lib/types';

interface UploadBoxProps {
  onUploadSuccess: (doc: DocumentItem) => void;
}

export default function UploadBox({ onUploadSuccess }: UploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const newDoc = await uploadDocumentFile(file);
      setSuccessMsg(`Uploaded ${newDoc.filename} (${newDoc.chunk_count} chunks indexed).`);
      onUploadSuccess(newDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Upload Patent Document
        </h3>
        <span className="text-[10px] font-semibold text-slate-500">PDF, DOCX, TXT</span>
      </div>

      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50/80 rounded-lg cursor-pointer transition text-center group">
        <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition mb-1" />
        <span className="text-xs font-semibold text-slate-700">
          {isUploading ? 'Ingesting & Indexing Document...' : 'Click to select or drag patent file'}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">
          Preserves exact page numbers & patent sections
        </span>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>

      {successMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
