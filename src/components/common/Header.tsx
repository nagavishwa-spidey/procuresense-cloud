import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  UploadCloud,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  Database,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProcurement } from '@/context/ProcurementContext';
import { CURRENCIES, CurrencyCode } from '@/types/procurement';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenImport }) => {
  const { user, isDemoUser, signOut, loginDemoUser } = useAuth();
  const { selectedCurrency, setCurrency, resetToDemoData } = useProcurement();

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between transition-colors shadow-sm">
      {/* Left: Brand Identity & Workspace Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 font-bold text-lg tracking-wider">
            PS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                ProcureSense <span className="text-teal-600 dark:text-teal-400">Cloud</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                v2.6 Enterprise
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>Global Enterprise Corp (HQ)</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />
                {isSupabaseConfigured ? 'Supabase Managed Cloud' : 'Local Sandbox Mode'}
              </span>
            </div>
          </div>
        </div>

        {isDemoUser && (
          <div className="hidden lg:flex items-center bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            Evaluation Dataset Active
          </div>
        )}
      </div>

      {/* Right Controls: Currency, Theme, Import CTA, Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Currency Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
          <Coins className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedCurrency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-transparent border-none text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code} className="dark:bg-slate-900">
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Import Button */}
        <button
          onClick={onOpenImport}
          className="inline-flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Import Data</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-800 dark:text-teal-200 font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                {user?.full_name || 'Guest User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                {user?.role || 'Analyst'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{user?.full_name}</p>
                <p className="text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 uppercase">
                    {user?.role}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-teal-500" /> RLS Protected
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    resetToDemoData();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-2"
                >
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>Reset Demo Dataset</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                <button
                  onClick={() => {
                    signOut();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
