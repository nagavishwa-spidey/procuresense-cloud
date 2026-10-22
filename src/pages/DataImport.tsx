import React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { generateSampleCSVTemplate } from '@/lib/importer';
import { downloadFile } from '@/lib/exporter';
import { formatDate } from '@/lib/utils';

interface DataImportPageProps {
  onOpenWizard: () => void;
}

export const DataImport: React.FC<DataImportPageProps> = ({ onOpenWizard }) => {
  const { importBatches, transactions } = useProcurement();

  const handleDownloadTemplate = () => {
    const csv = generateSampleCSVTemplate();
    downloadFile(csv, 'procuresense_import_template.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement Data Ingestion & Audit Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated column mapping, Zod schema validation, duplicate detection, and batch audit tracking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>

          <button
            onClick={onOpenWizard}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Launch Ingestion Wizard</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Committed Records
          </span>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {transactions.length.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Persisted in database with Row Level Security
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Supported Formats
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            .CSV, .XLSX, .XLS
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Integrated PapaParse + SheetJS parsing engine
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Duplicate Detection
          </span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Automated Hash Matching
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Flags exact PO collision and duplicate (vendor + date + amount)
          </p>
        </div>
      </div>

      {/* Ingestion Batch Audit History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload History & Batch Audit Log
          </h3>
          <span className="text-xs text-slate-500">{importBatches.length} Batches Processed</span>
        </div>

        {importBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No manual uploads committed yet
            </p>
            <p className="mt-1">
              Currently operating on the pre-loaded synthetic demonstration dataset. Click "Launch
              Ingestion Wizard" above to import your own dataset.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Batch ID</th>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-center">Total Records</th>
                  <th className="p-3 text-center">Successful</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {importBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {b.id.substring(0, 8)}...
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{b.filename}</td>
                    <td className="p-3 text-slate-500">{formatDate(b.created_at.split('T')[0])}</td>
                    <td className="p-3 text-center font-medium">{b.total_records}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">
                      {b.successful_records}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                        {b.status}
                      </span>
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
};
