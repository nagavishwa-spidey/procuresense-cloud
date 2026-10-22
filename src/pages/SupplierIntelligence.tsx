import React, { useState } from 'react';
import {
  Users2,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { formatCurrency } from '@/lib/utils';
import { SupplierSpendMetric } from '@/types/procurement';

export const SupplierIntelligence: React.FC = () => {
  const { supplierMetrics, supplierHHI, selectedCurrency, filteredTransactions } = useProcurement();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const filteredSuppliers = supplierMetrics.filter((s) =>
    s.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCompare = (supplierName: string) => {
    if (selectedForCompare.includes(supplierName)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== supplierName));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare up to 3 suppliers simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, supplierName]);
    }
  };

  const comparedSuppliersData = supplierMetrics.filter((s) =>
    selectedForCompare.includes(s.supplier)
  );

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Supplier Intelligence & Dependency Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vendor concentration scoring, Herfindahl-Hirschman Index (HHI), and side-by-side supplier benchmarks
          </p>
        </div>

        {selectedForCompare.length >= 2 && (
          <button
            onClick={() => setCompareModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Compare Selected ({selectedForCompare.length})</span>
          </button>
        )}
      </div>

      {/* Supplier Concentration & HHI Analytics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Herfindahl Index (HHI)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {supplierHHI.hhi.toLocaleString()}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                supplierHHI.hhi > 2500
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : supplierHHI.hhi >= 1500
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {supplierHHI.concentrationCategory}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Industry standard market concentration measure (sum of squared percentage market shares).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top 5 Vendor Share
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {supplierHHI.top5SharePct}%
            </span>
            <span className="text-xs text-slate-500">of total spend</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, supplierHHI.top5SharePct)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Active Vendors
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {supplierMetrics.length}
            </span>
            <span className="text-xs text-slate-500">Commercial partners</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Multi-source redundancy maintained across all key purchasing categories.
          </p>
        </div>
      </div>

      {/* Supplier Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <span className="text-xs text-slate-500">
            Select checkboxes to benchmark vendors side-by-side
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="p-3 w-10 text-center">Compare</th>
                <th className="p-3">Rank</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3 text-right">Total Spend</th>
                <th className="p-3 text-right">Spend Share</th>
                <th className="p-3 text-center">Orders</th>
                <th className="p-3 text-right">Avg Order Value</th>
                <th className="p-3 text-center">Delivery Score</th>
                <th className="p-3 text-center">Concentration Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSuppliers.map((s, idx) => (
                <tr key={s.supplier} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(s.supplier)}
                      onChange={() => toggleCompare(s.supplier)}
                      className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-mono text-slate-400 font-medium">#{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.supplier}</td>
                  <td className="p-3 text-right font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(s.spend, selectedCurrency)}
                  </td>
                  <td className="p-3 text-right font-medium">{s.percentage}%</td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-300">
                    {s.orderCount}
                  </td>
                  <td className="p-3 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrency(s.averageOrderValue, selectedCurrency)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {s.performanceScore}/100
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : s.riskLevel === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {s.riskLevel} Risk
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Comparison Workbench Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Side-by-Side Supplier Benchmarking
                </h3>
                <p className="text-xs text-slate-500">
                  Comparative performance and expenditure matrix
                </p>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {comparedSuppliersData.map((sup) => (
                <div
                  key={sup.supplier}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {sup.supplier}
                    </h4>
                    <span
                      className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        sup.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : sup.riskLevel === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sup.riskLevel} Risk
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Spend</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {formatCurrency(sup.spend, selectedCurrency)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Spend Share</span>
                      <span className="font-semibold">{sup.percentage}%</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Orders Processed</span>
                      <span className="font-semibold">{sup.orderCount} POs</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg PO Size</span>
                      <span className="font-semibold">
                        {formatCurrency(sup.averageOrderValue, selectedCurrency)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">On-Time Delivery</span>
                      <span className="font-semibold text-emerald-600">
                        {sup.onTimeDeliveryPct}%
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                      <span className="text-slate-500">Overall Scorecard</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sup.performanceScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                Done Benchmarking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
