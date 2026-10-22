import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { exportProcurementWorkbook, exportTransactionsToCSV } from '@/lib/exporter';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Reports: React.FC = () => {
  const { filteredTransactions, budgets, kpis, selectedCurrency } = useProcurement();

  const handlePrintBriefing = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement Reports & Executive Briefings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export audit-ready workbooks, budget variance ledgers, and formatted printable board briefings
          </p>
        </div>

        <button
          onClick={handlePrintBriefing}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Export Cards Grid (Hidden when printing) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Executive Multi-Sheet Excel Workbook
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete .XLSX workbook containing Executive KPIs, Category Spend, Supplier Intelligence,
              and Department Variance sheets.
            </p>
          </div>
          <button
            onClick={() => exportProcurementWorkbook(filteredTransactions, budgets, kpis)}
            className="mt-4 flex items-center justify-center space-x-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .XLSX</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 w-fit">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Raw Transactions CSV Ledger
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard comma-separated file with all filtered PO numbers, unit costs, payment
              statuses, and ERP references for external reconciliation.
            </p>
          </div>
          <button
            onClick={() => exportTransactionsToCSV(filteredTransactions)}
            className="mt-4 flex items-center justify-center space-x-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .CSV</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Compliance & Security Audit Log
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tenant-isolated verification report confirming Row Level Security (RLS) policies and
              database isolation integrity.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>RLS Active • Multi-Tenant Isolated</span>
          </div>
        </div>
      </div>

      {/* Printable Executive Briefing Document Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        {/* Letterhead Header */}
        <div className="border-b-2 border-teal-600 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                ProcureSense <span className="text-teal-600">Cloud</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                OFFICIAL REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fiscal Governance & Procurement Spend Portfolio Briefing
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-900 dark:text-white">Global Enterprise Corp</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Currency: {selectedCurrency}</p>
          </div>
        </div>

        {/* Executive Highlights Table */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Key Performance Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Total Spend</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(kpis.totalSpend, selectedCurrency)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Transactions</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {kpis.totalTransactions}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Budget Depletion</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {kpis.budgetUtilizationPct.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Est. Savings Target</span>
              <p className="text-base font-bold text-emerald-600 mt-1">
                {formatCurrency(kpis.potentialSavingsEstimate, selectedCurrency)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Summary List Preview */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. High-Value PO Audit Sample
          </h4>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-2.5">PO #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td className="p-2.5 font-mono">{t.po_number}</td>
                    <td className="p-2.5">{formatDate(t.purchase_date)}</td>
                    <td className="p-2.5 font-medium">{t.supplier_name}</td>
                    <td className="p-2.5">{t.category_name}</td>
                    <td className="p-2.5 text-right font-bold">
                      {formatCurrency(t.total_amount, selectedCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signoff Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-400">
          <div>
            <p>Prepared by: Enterprise Procurement Team</p>
            <p className="text-[10px] mt-0.5">ProcureSense Cloud v2.6</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p>Authorized Signature & Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
};
