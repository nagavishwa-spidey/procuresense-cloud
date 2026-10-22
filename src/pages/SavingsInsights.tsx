import React from 'react';
import {
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  Copy,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { formatCurrency } from '@/lib/utils';

export const SavingsInsights: React.FC = () => {
  const { anomalies, savingsScenarios, selectedCurrency, kpis } = useProcurement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement Savings & Statistical Anomaly Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explainable outlier detection, suspected duplicate invoice alerts, and estimated consolidation savings
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 dark:text-teal-200">
          <TrendingDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>
            Total Estimated Potential Savings:{' '}
            {formatCurrency(kpis.potentialSavingsEstimate, selectedCurrency)}
          </span>
        </div>
      </div>

      {/* SECTION 1: Statistical Anomalies & Outliers */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Flagged Anomalies & Policy Deviations ({anomalies.length})
          </h2>
        </div>

        {anomalies.length === 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">Clean Financial Health Detected</p>
            <p className="text-emerald-600 dark:text-emerald-400 mt-1">
              No transactions currently exceed the Interquartile Range (IQR) outlier threshold or
              duplicate PO criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 text-xs"
              >
                {/* Header Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        anom.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : anom.severity === 'high'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {anom.severity} Severity • {anom.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {anom.title}
                    </h3>
                  </div>

                  {anom.estimatedSaving && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Est. Recoverable</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(anom.estimatedSaving, selectedCurrency)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-300">{anom.description}</p>

                {/* Mathematical Rule Block */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[11px] mb-1">
                    <Calculator className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Explainable Rule Applied</span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {anom.calculationMethod}
                  </p>
                </div>

                {/* Business Impact & Recommended Action */}
                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Business Risk:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{anom.businessImpact}</span>
                  </div>

                  <div className="bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-100 dark:border-teal-900/40">
                    <span className="font-bold text-teal-800 dark:text-teal-300">
                      Recommended Action:{' '}
                    </span>
                    <span className="text-teal-700 dark:text-teal-400">
                      {anom.recommendedAction}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Category Cost-Saving Opportunities */}
      <div className="pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Consolidation & Sourcing Opportunities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingsScenarios.map((scen) => (
            <div
              key={scen.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between text-xs space-y-3"
            >
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                  {scen.category} Sourcing
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {scen.title}
                </h3>
                <div className="mt-2 flex items-baseline justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Current Spend</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(scen.currentSpend, selectedCurrency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Est. Savings (7%)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(scen.estimatedSavingAmount, selectedCurrency)}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  {scen.rationale}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Action Checklist:
                </span>
                <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                  {scen.actionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-teal-500 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
