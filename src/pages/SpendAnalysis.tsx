import React, { useState } from 'react';
import {
  Download,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  ArrowUpDown,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { FilterBar } from '@/components/common/FilterBar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportTransactionsToCSV } from '@/lib/exporter';
import { ProcurementTransaction } from '@/types/procurement';

export const SpendAnalysis: React.FC = () => {
  const { filteredTransactions, selectedCurrency, deleteTransaction } = useProcurement();

  const [selectedTx, setSelectedTx] = useState<ProcurementTransaction | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof ProcurementTransaction>('purchase_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 15;

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') valA = (valA as string).toLowerCase();
    if (typeof valB === 'string') valB = (valB as string).toLowerCase();

    if (valA! < valB!) return sortOrder === 'asc' ? -1 : 1;
    if (valA! > valB!) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: keyof ProcurementTransaction) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement Spend Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Granular line-item audit, payment status tracking, and multi-dimensional drill-downs
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Filtered ({filteredTransactions.length} POs)</span>
        </button>
      </div>

      <FilterBar />

      {/* Transaction Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} Transactions
          </div>
          <div className="text-xs text-slate-400">
            Click column headers to sort • Click row to view details
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 select-none">
              <tr>
                <th
                  onClick={() => handleSort('po_number')}
                  className="p-3 font-semibold cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>PO Number</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('purchase_date')}
                  className="p-3 font-semibold cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('supplier_name')}
                  className="p-3 font-semibold cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category_name')}
                  className="p-3 font-semibold cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('department_name')}
                  className="p-3 font-semibold cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_amount')}
                  className="p-3 font-semibold text-right cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-3 font-semibold text-center">Payment</th>
                <th className="p-3 font-semibold text-center">Delivery</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {tx.po_number}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {formatDate(tx.purchase_date)}
                  </td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    {tx.supplier_name}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tx.category_name}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {tx.department_name}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(tx.total_amount, selectedCurrency)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        tx.payment_status === 'paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : tx.payment_status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {tx.payment_status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        tx.delivery_status === 'delivered'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : tx.delivery_status === 'in_transit'
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {tx.delivery_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Line-item Details Drill-down Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs text-teal-600 font-mono font-bold">
                  {selectedTx.po_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Order Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400">Date</span>
                  <p className="font-semibold">{formatDate(selectedTx.purchase_date)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Total Spend</span>
                  <p className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                    {formatCurrency(selectedTx.total_amount, selectedCurrency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Supplier</span>
                  <p className="font-semibold">{selectedTx.supplier_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Department</span>
                  <p className="font-semibold">{selectedTx.department_name}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Description</span>
                <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                  {selectedTx.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 dark:border-slate-800 py-2">
                <div>
                  <span className="text-slate-400">Quantity</span>
                  <p className="font-semibold">{selectedTx.quantity}</p>
                </div>
                <div>
                  <span className="text-slate-400">Unit Price</span>
                  <p className="font-semibold">
                    {formatCurrency(selectedTx.unit_price, selectedCurrency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Payment Status</span>
                  <p className="font-semibold capitalize">{selectedTx.payment_status}</p>
                </div>
              </div>

              {selectedTx.contract_ref && (
                <div>
                  <span className="text-slate-400">Contract Reference</span>
                  <p className="font-mono text-teal-600 dark:text-teal-400">
                    {selectedTx.contract_ref}
                  </p>
                </div>
              )}

              {selectedTx.notes && (
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <span className="font-semibold block text-[10px] text-slate-400 uppercase">
                    Audit Notes
                  </span>
                  {selectedTx.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
