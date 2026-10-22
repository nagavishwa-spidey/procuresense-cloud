import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'vs last period',
  subtitle,
  status = 'normal',
}) => {
  const statusColors = {
    normal: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    danger: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg border ${statusColors[status]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
      </div>

      <div className="mt-2 flex items-center text-xs space-x-1.5">
        {change !== undefined && (
          <span
            className={`inline-flex items-center font-medium ${
              change > 0
                ? 'text-rose-600 dark:text-rose-400'
                : change < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : change < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <Minus className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
          </span>
        )}
        <span className="text-slate-400 dark:text-slate-500 truncate">
          {subtitle || changeLabel}
        </span>
      </div>
    </div>
  );
};
