import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Users2,
  WalletCards,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Settings,
  ChevronRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { formatCurrency } from '@/lib/utils';

export type NavTab =
  | 'dashboard'
  | 'spend'
  | 'suppliers'
  | 'budgets'
  | 'insights'
  | 'import'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { kpis, anomalies, selectedCurrency } = useProcurement();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'spend' as NavTab,
      label: 'Spend Analysis',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Supplier Intelligence',
      icon: Users2,
      badge: `${kpis.activeSuppliersCount}`,
    },
    {
      id: 'budgets' as NavTab,
      label: 'Budget Management',
      icon: WalletCards,
      badge: `${Math.round(kpis.budgetUtilizationPct)}%`,
    },
    {
      id: 'insights' as NavTab,
      label: 'Savings & Anomalies',
      icon: AlertTriangle,
      badge: anomalies.length > 0 ? `${anomalies.length}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'import' as NavTab,
      label: 'Data Ingestion',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Exports',
      icon: FileText,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'System & Org Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Platform Branding */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Procurement Platform
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Cloud Data Mesh Active
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-400 font-mono">
            TLS 1.3
          </span>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.badgeColor || (isActive ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'opacity-100 translate-x-0.5' : 'opacity-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mini Executive Metric Card in Sidebar */}
      <div className="p-3 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-teal-400" /> Potential Savings
            </span>
            <span className="text-[10px] text-teal-400 font-medium">Estimated</span>
          </div>
          <div className="text-base font-bold text-white tracking-tight">
            {formatCurrency(kpis.potentialSavingsEstimate, selectedCurrency)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Across {kpis.categoriesCount} categories with vendor consolidation potential.
          </p>
        </div>
      </div>
    </aside>
  );
};
