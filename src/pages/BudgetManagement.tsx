import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  TrendingUp,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { formatCurrency } from '@/lib/utils';
import { Budget } from '@/types/procurement';

export const BudgetManagement: React.FC = () => {
  const { budgets, departmentSpend, selectedCurrency, addBudget, updateBudget, deleteBudget } =
    useProcurement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [deptName, setDeptName] = useState('');
  const [amount, setAmount] = useState<number>(250000);

  const openCreateModal = () => {
    setEditingBudget(null);
    setName('');
    setFiscalYear(2026);
    setDeptName(departmentSpend[0]?.department || 'Engineering');
    setAmount(250000);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setName(b.name);
    setFiscalYear(b.fiscal_year);
    setDeptName(b.department_name || '');
    setAmount(b.allocated_amount);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount <= 0) {
      alert('Please provide a valid budget name and positive allocation.');
      return;
    }

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        name,
        fiscal_year: fiscalYear,
        department_name: deptName,
        allocated_amount: amount,
      });
    } else {
      await addBudget({
        name,
        fiscal_year: fiscalYear,
        period_type: 'annual',
        period_value: 'FY',
        department_name: deptName,
        allocated_amount: amount,
        currency: 'USD',
      });
    }

    setIsModalOpen(false);
  };

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);
  const totalSpent = departmentSpend.reduce((sum, d) => sum + d.spend, 0);
  const totalVariance = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Department Budget Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set fiscal allocations, monitor depletion rates, and configure warning thresholds (80%, 90%, 100%)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Budget</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Budget Allocation (FY2026)
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalAllocated, selectedCurrency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {budgets.length} departmental allocations
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Realized Expenditure
          </span>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(totalSpent, selectedCurrency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Overall Portfolio Utilization: {overallUtilization.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Unspent Capital (Variance)
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              totalVariance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(totalVariance, selectedCurrency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalVariance >= 0 ? 'Surplus remaining in fiscal pool' : 'Overall portfolio budget overrun'}
          </p>
        </div>
      </div>

      {/* Department Utilization Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Department Budget Utilization & Health
          </h3>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;80% Healthy
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 80-99% Warning
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> &ge;100% Overrun
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
          {departmentSpend.map((d) => {
            const relatedBudget = budgets.find((b) => b.department_name === d.department);
            return (
              <div key={d.department} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.department}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'overrun'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : d.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {d.utilizationPct}% Utilized
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500">
                      Spent:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(d.spend, selectedCurrency)}
                      </strong>{' '}
                      /{' '}
                      <span>{formatCurrency(d.allocatedBudget, selectedCurrency)}</span>
                    </span>
                    {relatedBudget && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(relatedBudget)}
                          className="p-1 text-slate-400 hover:text-teal-600"
                          title="Edit Budget"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBudget(relatedBudget.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete Budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      d.status === 'overrun'
                        ? 'bg-rose-500'
                        : d.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, d.utilizationPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingBudget ? 'Edit Department Budget' : 'Configure New Budget'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set fiscal allocation limit and department owner.
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Budget Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FY2026 Engineering Budget"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Fiscal Year</label>
                  <input
                    type="number"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Department</label>
                  <select
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
                  >
                    {departmentSpend.map((d) => (
                      <option key={d.department} value={d.department}>
                        {d.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Allocated Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
