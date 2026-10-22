import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  Building,
  Tags,
  Receipt,
  PiggyBank,
  TrendingDown,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useProcurement } from '@/context/ProcurementContext';
import { MetricCard } from '@/components/common/MetricCard';
import { FilterBar } from '@/components/common/FilterBar';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { exportProcurementWorkbook } from '@/lib/exporter';
import { CURRENCIES } from '@/types/procurement';

const CATEGORY_COLORS = [
  '#0d9488', // teal-600
  '#0284c7', // sky-600
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#64748b', // slate-500
];

interface DashboardProps {
  onOpenImport: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenImport, onNavigateTab }) => {
  const {
    kpis,
    monthlyTrends,
    categorySpend,
    departmentSpend,
    supplierMetrics,
    anomalies,
    selectedCurrency,
    filteredTransactions,
    budgets,
  } = useProcurement();

  const handleExportFullReport = () => {
    exportProcurementWorkbook(filteredTransactions, budgets, kpis);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time financial spend governance, budget utilization, and statistical cost-saving intelligence
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportFullReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Report (Excel)</span>
          </button>
          <button
            onClick={onOpenImport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Upload New Dataset</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Primary KPI Grid (8 Calculated Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Procurement Spend"
          value={formatCurrency(kpis.totalSpend, selectedCurrency)}
          icon={DollarSign}
          change={kpis.momSpendChangePct}
          changeLabel="vs previous month"
          status="normal"
        />

        <MetricCard
          title="Total Purchase Transactions"
          value={kpis.totalTransactions.toLocaleString()}
          icon={ShoppingCart}
          subtitle={`Across ${kpis.categoriesCount} spend categories`}
          status="normal"
        />

        <MetricCard
          title="Active Suppliers"
          value={kpis.activeSuppliersCount.toString()}
          icon={Building}
          subtitle="Qualified vendor base"
          status="normal"
        />

        <MetricCard
          title="Average PO Value"
          value={formatCurrency(kpis.averagePOValue, selectedCurrency)}
          icon={Receipt}
          subtitle="Mean line-item spend"
          status="normal"
        />

        <MetricCard
          title="Budget Utilization"
          value={`${kpis.budgetUtilizationPct.toFixed(1)}%`}
          icon={PiggyBank}
          subtitle={`Allocated: ${formatCurrency(kpis.totalBudgetAllocated, selectedCurrency)}`}
          status={
            kpis.budgetUtilizationPct > 100
              ? 'danger'
              : kpis.budgetUtilizationPct > 85
              ? 'warning'
              : 'success'
          }
        />

        <MetricCard
          title="Spend Categories"
          value={kpis.categoriesCount.toString()}
          icon={Tags}
          subtitle="Active taxonomies"
          status="normal"
        />

        <MetricCard
          title="Identified Cost Savings (Est.)"
          value={formatCurrency(kpis.potentialSavingsEstimate, selectedCurrency)}
          icon={TrendingDown}
          subtitle="Target 5.5% addressable spend"
          status="success"
        />

        <MetricCard
          title="Procurement Anomalies"
          value={anomalies.length.toString()}
          icon={AlertCircle}
          subtitle={anomalies.length > 0 ? 'Requires management review' : 'No outliers detected'}
          status={anomalies.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Anomaly Quick Alert Banner if any high severity issues */}
      {anomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-rose-900 dark:text-rose-200">
                {anomalies.length} Spend Anomalies & Duplicate POs Flagged by Statistical Engine
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Outliers detected using Tukey's Interquartile Range (IQR) rule and exact invoice matching.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('insights')}
            className="flex items-center space-x-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white underline underline-offset-2"
          >
            <span>Review Insights</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Charts Row 1: Monthly Spend Trend & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Spend Trajectory
              </h3>
              <p className="text-xs text-slate-500">Expenditure trends across recent fiscal months</p>
            </div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded">
              Trend Analytics
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const symbol = CURRENCIES[selectedCurrency]?.symbol || '₹';
                    if (selectedCurrency === 'INR') {
                      if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(1)}Cr`;
                      if (val >= 100000) return `${symbol}${(val / 100000).toFixed(1)}L`;
                    }
                    return `${symbol}${(val / 1000).toFixed(0)}k`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val), selectedCurrency), 'Spend']}
                />
                <Area
                  type="monotone"
                  dataKey="totalSpend"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                  name="Monthly Spend"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spend by Category</h3>
            <p className="text-xs text-slate-500">Distribution across purchasing taxonomies</p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpend}
                  dataKey="spend"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categorySpend.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val), selectedCurrency), 'Spend']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Category Legend */}
          <div className="mt-auto space-y-1 max-h-32 overflow-y-auto pr-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            {categorySpend.slice(0, 5).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white ml-2">
                  {c.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Department Budget vs Actual & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Budget vs Actual Expenditure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Department Spend vs Budget Allocation
              </h3>
              <p className="text-xs text-slate-500">Expenditure variance against planned FY2026 budgets</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              Manage Budgets
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentSpend}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="department"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const symbol = CURRENCIES[selectedCurrency]?.symbol || '₹';
                    if (selectedCurrency === 'INR') {
                      if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(1)}Cr`;
                      if (val >= 100000) return `${symbol}${(val / 100000).toFixed(1)}L`;
                    }
                    return `${symbol}${(val / 1000).toFixed(0)}k`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val), selectedCurrency)]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="spend" name="Actual Spend" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allocatedBudget" name="Budget Allocation" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 6 Suppliers by Total Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Suppliers by Spend
              </h3>
              <p className="text-xs text-slate-500">Major vendor partners by total committed expenditure</p>
            </div>
            <button
              onClick={() => onNavigateTab('suppliers')}
              className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              View All Vendors
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={supplierMetrics.slice(0, 6)}
                margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const symbol = CURRENCIES[selectedCurrency]?.symbol || '₹';
                    if (selectedCurrency === 'INR') {
                      if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(1)}Cr`;
                      if (val >= 100000) return `${symbol}${(val / 100000).toFixed(1)}L`;
                    }
                    return `${symbol}${(val / 1000).toFixed(0)}k`;
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="supplier"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val), selectedCurrency), 'Spend']}
                />
                <Bar dataKey="spend" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
