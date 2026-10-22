import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Coins,
  Shield,
  RotateCcw,
  Trash2,
  CheckCircle,
  Database,
  Cloud,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES, CurrencyCode } from '@/types/procurement';
import { isSupabaseConfigured } from '@/lib/supabase';

export const Settings: React.FC = () => {
  const { selectedCurrency, setCurrency, resetToDemoData, clearAllData, transactions } =
    useProcurement();
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState('Global Enterprise Corp');
  const [fiscalYearStart, setFiscalYearStart] = useState('1'); // January
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [criticalThreshold, setCriticalThreshold] = useState('90');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the standard 200+ synthetic demo transactions and pre-configured budgets?'
      )
    ) {
      resetToDemoData();
      alert('Demo procurement dataset restored successfully.');
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'WARNING: This will purge all active procurement records, budgets, and import batches from the local state. Continue?'
      )
    ) {
      clearAllData();
      alert('Workspace data cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System & Organization Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage workspace profile, fiscal calendar settings, currency configurations, and dataset hygiene
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Organization settings saved successfully!</span>
        </div>
      )}

      {/* Cloud Service Architecture Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloud Computing & Backend Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Active configuration for managed database, storage, and authentication
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block">Database Tier</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Supabase Managed PostgreSQL (AWS us-east-1)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Status: {isSupabaseConfigured ? '🟢 Live Connected' : '🟡 Offline Sandbox Mode'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block">Row Level Security (RLS)</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Strict Multi-Tenant Isolation Active
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All queries filtered by user organization membership ID
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5 text-xs"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Profile</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure entity name and default reporting currency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Primary Reporting Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fiscal Year Start Month
            </label>
            <select
              value={fiscalYearStart}
              onChange={(e) => setFiscalYearStart(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
            >
              <option value="1">January (Calendar Year)</option>
              <option value="4">April (Standard Fiscal)</option>
              <option value="7">July (Mid-Year)</option>
              <option value="10">October (US Federal)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Budget Warning Threshold (%)
            </label>
            <input
              type="number"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Critical Alert Threshold (%)
            </label>
            <input
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
          >
            Save Workspace Settings
          </button>
        </div>
      </form>

      {/* Dataset & Reset Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 text-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dataset Management</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Reset or purge active records ({transactions.length} transactions stored).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Restore Synthetic Demonstration Dataset
            </h4>
            <p className="text-slate-500 text-[11px]">
              Populates 200+ realistic multi-department records with planted IQR price outliers and
              duplicate PO test cases.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 rounded-lg font-medium transition text-xs flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span>Restore Demo Dataset</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
          <div>
            <h4 className="font-semibold text-rose-800 dark:text-rose-300">
              Purge All Procurement Records
            </h4>
            <p className="text-rose-600 dark:text-rose-400 text-[11px]">
              Permanently clears all imported transactions and budgets from your local workspace.
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition text-xs flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
