import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Building, Tag } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, transactions } = useProcurement();

  // Extract unique lists for dropdowns
  const availableDepts = Array.from(new Set(transactions.map((t) => t.department_name))).sort();
  const availableCats = Array.from(new Set(transactions.map((t) => t.category_name))).sort();
  const availableSuppliers = Array.from(new Set(transactions.map((t) => t.supplier_name))).sort();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      departments: val ? [val] : [],
    }));
  };

  const handleCatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      categories: val ? [val] : [],
    }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      suppliers: val ? [val] : [],
    }));
  };

  const handleQuickDate = (period: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (period === 'all') {
      setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }

    let start = new Date();
    if (period === '30d') {
      start.setDate(today.getDate() - 30);
    } else if (period === '90d') {
      start.setDate(today.getDate() - 90);
    } else if (period === 'ytd') {
      start = new Date(today.getFullYear(), 0, 1);
    } else if (period === '1y') {
      start.setFullYear(today.getFullYear() - 1);
    }

    setFilters((prev) => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: todayStr,
    }));
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.startDate ||
    filters.endDate ||
    filters.departments.length > 0 ||
    filters.categories.length > 0 ||
    filters.suppliers.length > 0
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search PO #, supplier, description..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {/* Date Range Shortcuts */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => handleQuickDate('all')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            !filters.startDate && !filters.endDate
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => handleQuickDate('30d')}
          className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          30D
        </button>
        <button
          onClick={() => handleQuickDate('90d')}
          className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          90D
        </button>
        <button
          onClick={() => handleQuickDate('ytd')}
          className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          YTD
        </button>
      </div>

      {/* Dropdown Filters */}
      <div className="flex items-center space-x-2">
        {/* Department */}
        <div className="relative">
          <select
            value={filters.departments[0] || ''}
            onChange={handleDeptChange}
            className="pl-3 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Departments</option>
            {availableDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={filters.categories[0] || ''}
            onChange={handleCatChange}
            className="pl-3 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {availableCats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier */}
        <div className="relative hidden lg:block">
          <select
            value={filters.suppliers[0] || ''}
            onChange={handleSupplierChange}
            className="pl-3 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Suppliers</option>
            {availableSuppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
            title="Reset active filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
