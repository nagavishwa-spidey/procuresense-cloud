import {
  ProcurementTransaction,
  Budget,
  SpendFilter,
  KPISummary,
  MonthlyTrend,
  CategorySpend,
  DepartmentSpend,
  SupplierSpendMetric,
  AnomalyInsight,
  SavingsScenario,
} from '@/types/procurement';

/**
 * Filter transactions based on active spend filters
 */
export function filterTransactions(
  transactions: ProcurementTransaction[],
  filters: SpendFilter
): ProcurementTransaction[] {
  return transactions.filter((tx) => {
    // Date filter
    if (filters.startDate && tx.purchase_date < filters.startDate) return false;
    if (filters.endDate && tx.purchase_date > filters.endDate) return false;

    // Department filter
    if (
      filters.departments.length > 0 &&
      !filters.departments.includes(tx.department_name)
    ) {
      return false;
    }

    // Category filter
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(tx.category_name)
    ) {
      return false;
    }

    // Supplier filter
    if (
      filters.suppliers.length > 0 &&
      !filters.suppliers.includes(tx.supplier_name)
    ) {
      return false;
    }

    // Payment Status filter
    if (
      filters.paymentStatuses.length > 0 &&
      !filters.paymentStatuses.includes(tx.payment_status)
    ) {
      return false;
    }

    // Delivery Status filter
    if (
      filters.deliveryStatuses.length > 0 &&
      !filters.deliveryStatuses.includes(tx.delivery_status)
    ) {
      return false;
    }

    // Min / Max Amount
    if (filters.minAmount !== undefined && tx.total_amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && tx.total_amount > filters.maxAmount) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchPo = tx.po_number.toLowerCase().includes(q);
      const matchSupplier = tx.supplier_name.toLowerCase().includes(q);
      const matchCategory = tx.category_name.toLowerCase().includes(q);
      const matchDept = tx.department_name.toLowerCase().includes(q);
      const matchDesc = tx.description.toLowerCase().includes(q);
      if (!matchPo && !matchSupplier && !matchCategory && !matchDept && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate Executive KPI Summary
 */
export function calculateKPISummary(
  filteredTransactions: ProcurementTransaction[],
  allTransactions: ProcurementTransaction[],
  budgets: Budget[]
): KPISummary {
  const totalSpend = filteredTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalTransactions = filteredTransactions.length;

  const supplierSet = new Set(filteredTransactions.map((tx) => tx.supplier_name));
  const activeSuppliersCount = supplierSet.size;

  const categorySet = new Set(filteredTransactions.map((tx) => tx.category_name));
  const categoriesCount = categorySet.size;

  const averagePOValue = totalTransactions > 0 ? totalSpend / totalTransactions : 0;

  // Budget calculations
  const totalBudgetAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);
  const budgetUtilizationPct =
    totalBudgetAllocated > 0 ? (totalSpend / totalBudgetAllocated) * 100 : 0;

  // Month-over-Month (MoM) calculation
  // Find current month and previous month from filtered transactions
  const dates = filteredTransactions.map((tx) => tx.purchase_date).sort();
  let momSpendChangePct = 0;

  if (dates.length > 0) {
    const latestDate = dates[dates.length - 1];
    const latestMonthPrefix = latestDate.substring(0, 7); // 'YYYY-MM'

    // Compute previous month prefix
    const [year, month] = latestMonthPrefix.split('-').map(Number);
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(
      prevMonthDate.getMonth() + 1
    ).padStart(2, '0')}`;

    const currentMonthSpend = filteredTransactions
      .filter((tx) => tx.purchase_date.startsWith(latestMonthPrefix))
      .reduce((sum, tx) => sum + tx.total_amount, 0);

    const prevMonthSpend = allTransactions
      .filter((tx) => tx.purchase_date.startsWith(prevMonthPrefix))
      .reduce((sum, tx) => sum + tx.total_amount, 0);

    if (prevMonthSpend > 0) {
      momSpendChangePct = ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100;
    }
  }

  // Estimated potential savings based on transparent 5.5% addressable spend consolidation
  const potentialSavingsEstimate = Math.round(totalSpend * 0.055);

  return {
    totalSpend,
    totalTransactions,
    activeSuppliersCount,
    categoriesCount,
    averagePOValue,
    budgetUtilizationPct,
    totalBudgetAllocated,
    momSpendChangePct,
    potentialSavingsEstimate,
  };
}

/**
 * Calculate Monthly Spend Trends
 */
export function calculateMonthlyTrends(
  transactions: ProcurementTransaction[]
): MonthlyTrend[] {
  const monthMap = new Map<string, { spend: number; count: number }>();

  transactions.forEach((tx) => {
    const monthKey = tx.purchase_date.substring(0, 7); // 'YYYY-MM'
    const cur = monthMap.get(monthKey) || { spend: 0, count: 0 };
    cur.spend += tx.total_amount;
    cur.count += 1;
    monthMap.set(monthKey, cur);
  });

  const sortedKeys = Array.from(monthMap.keys()).sort();

  return sortedKeys.map((key, idx) => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const current = monthMap.get(key)!;

    // Optional comparison with previous month
    let previousPeriodSpend: number | undefined = undefined;
    if (idx > 0) {
      const prevKey = sortedKeys[idx - 1];
      previousPeriodSpend = monthMap.get(prevKey)?.spend;
    }

    return {
      monthKey: key,
      label,
      totalSpend: Math.round(current.spend),
      transactionCount: current.count,
      previousPeriodSpend: previousPeriodSpend ? Math.round(previousPeriodSpend) : undefined,
    };
  });
}

/**
 * Calculate Spend by Category with Pareto (80/20) analysis
 */
export function calculateCategorySpend(
  transactions: ProcurementTransaction[]
): CategorySpend[] {
  const totalSpend = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const categoryMap = new Map<string, { spend: number; count: number }>();

  transactions.forEach((tx) => {
    const cur = categoryMap.get(tx.category_name) || { spend: 0, count: 0 };
    cur.spend += tx.total_amount;
    cur.count += 1;
    categoryMap.set(tx.category_name, cur);
  });

  // Sort descending by spend
  const sorted = Array.from(categoryMap.entries())
    .map(([category, val]) => ({
      category,
      spend: Math.round(val.spend),
      percentage: totalSpend > 0 ? (val.spend / totalSpend) * 100 : 0,
      transactionCount: val.count,
    }))
    .sort((a, b) => b.spend - a.spend);

  // Compute cumulative Pareto percentage
  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += item.percentage;
    return {
      ...item,
      paretoCumulativePct: parseFloat(cumulative.toFixed(1)),
      isParetoTop80: cumulative - item.percentage < 80,
    };
  });
}

/**
 * Calculate Department-wise Expenditure vs Budgets
 */
export function calculateDepartmentSpend(
  transactions: ProcurementTransaction[],
  budgets: Budget[]
): DepartmentSpend[] {
  const deptMap = new Map<string, number>();

  transactions.forEach((tx) => {
    const cur = deptMap.get(tx.department_name) || 0;
    deptMap.set(tx.department_name, cur + tx.total_amount);
  });

  // Unique list of all departments seen in transactions or budgets
  const allDepts = new Set<string>([
    ...Array.from(deptMap.keys()),
    ...budgets.map((b) => b.department_name).filter(Boolean) as string[],
  ]);

  return Array.from(allDepts).map((dept) => {
    const spend = Math.round(deptMap.get(dept) || 0);
    const allocatedBudget = budgets
      .filter((b) => b.department_name === dept)
      .reduce((sum, b) => sum + b.allocated_amount, 0);

    const variance = allocatedBudget - spend;
    const utilizationPct = allocatedBudget > 0 ? (spend / allocatedBudget) * 100 : 0;

    let status: 'normal' | 'warning' | 'overrun' = 'normal';
    if (utilizationPct >= 100) {
      status = 'overrun';
    } else if (utilizationPct >= 85) {
      status = 'warning';
    }

    return {
      department: dept,
      spend,
      allocatedBudget,
      variance,
      utilizationPct: parseFloat(utilizationPct.toFixed(1)),
      status,
    };
  }).sort((a, b) => b.spend - a.spend);
}

/**
 * Calculate Supplier Spend Metrics and Scorecards
 */
export function calculateSupplierMetrics(
  transactions: ProcurementTransaction[]
): SupplierSpendMetric[] {
  const totalSpend = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const supplierMap = new Map<
    string,
    { spend: number; count: number; deliveredCount: number; onTimeCount: number }
  >();

  transactions.forEach((tx) => {
    const cur = supplierMap.get(tx.supplier_name) || {
      spend: 0,
      count: 0,
      deliveredCount: 0,
      onTimeCount: 0,
    };
    cur.spend += tx.total_amount;
    cur.count += 1;
    if (tx.delivery_status === 'delivered') {
      cur.deliveredCount += 1;
      cur.onTimeCount += 1;
    } else if (tx.delivery_status === 'in_transit') {
      cur.onTimeCount += 0.8;
    }
    supplierMap.set(tx.supplier_name, cur);
  });

  return Array.from(supplierMap.entries())
    .map(([supplier, val]) => {
      const percentage = totalSpend > 0 ? (val.spend / totalSpend) * 100 : 0;
      const averageOrderValue = val.count > 0 ? val.spend / val.count : 0;
      const onTimeDeliveryPct =
        val.count > 0 ? Math.min(100, Math.round((val.deliveredCount / val.count) * 100)) : 100;

      // Transparent performance score (0-100) based on on-time delivery (50%) and order volume stability (50%)
      const performanceScore = Math.round(onTimeDeliveryPct * 0.7 + Math.min(30, val.count * 2));

      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (percentage > 25) {
        riskLevel = 'High'; // High dependency risk
      } else if (percentage > 12) {
        riskLevel = 'Medium';
      }

      return {
        supplier,
        spend: Math.round(val.spend),
        percentage: parseFloat(percentage.toFixed(1)),
        orderCount: val.count,
        averageOrderValue: Math.round(averageOrderValue),
        onTimeDeliveryPct,
        performanceScore: Math.min(100, performanceScore),
        riskLevel,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for Supplier Concentration
 * Range: 0 to 10,000.
 * < 1500 = Unconcentrated (healthy competition)
 * 1500 - 2500 = Moderate concentration
 * > 2500 = Highly concentrated (supplier dependency risk)
 */
export function calculateSupplierHHI(supplierMetrics: SupplierSpendMetric[]): {
  hhi: number;
  concentrationCategory: 'Low Concentration' | 'Moderate Concentration' | 'High Concentration';
  top5SharePct: number;
} {
  if (supplierMetrics.length === 0) {
    return { hhi: 0, concentrationCategory: 'Low Concentration', top5SharePct: 0 };
  }

  // Sum of squares of market share percentages
  const hhi = Math.round(
    supplierMetrics.reduce((sum, s) => sum + Math.pow(s.percentage, 2), 0)
  );

  const top5SharePct = parseFloat(
    supplierMetrics.slice(0, 5).reduce((sum, s) => sum + s.percentage, 0).toFixed(1)
  );

  let concentrationCategory: 'Low Concentration' | 'Moderate Concentration' | 'High Concentration' =
    'Low Concentration';
  if (hhi > 2500) {
    concentrationCategory = 'High Concentration';
  } else if (hhi >= 1500) {
    concentrationCategory = 'Moderate Concentration';
  }

  return { hhi, concentrationCategory, top5SharePct };
}

/**
 * Anomaly Detection Engine: IQR Outliers, Duplicate POs, and Budget Overruns
 */
export function detectProcurementAnomalies(
  transactions: ProcurementTransaction[],
  budgets: Budget[]
): AnomalyInsight[] {
  const insights: AnomalyInsight[] = [];

  // ==================================================================
  // 1. Interquartile Range (IQR) Price Outlier Detection by Category
  // ==================================================================
  const categoryGroups = new Map<string, ProcurementTransaction[]>();
  transactions.forEach((tx) => {
    const list = categoryGroups.get(tx.category_name) || [];
    list.push(tx);
    categoryGroups.set(tx.category_name, list);
  });

  categoryGroups.forEach((txList, category) => {
    if (txList.length < 4) return; // Need at least 4 items for meaningful IQR

    const amounts = txList.map((t) => t.total_amount).sort((a, b) => a - b);
    const q1Index = Math.floor(amounts.length * 0.25);
    const q3Index = Math.floor(amounts.length * 0.75);
    const q1 = amounts[q1Index];
    const q3 = amounts[q3Index];
    const iqr = q3 - q1;
    const threshold = q3 + 1.5 * iqr;

    txList.forEach((tx) => {
      if (tx.total_amount > threshold && tx.total_amount > 5000) {
        insights.push({
          id: `anomaly-iqr-${tx.id}`,
          type: 'price_outlier',
          severity: tx.total_amount > threshold * 2 ? 'critical' : 'high',
          title: `Statistical Spend Outlier in ${category}`,
          description: `Transaction ${tx.po_number} with ${tx.supplier_name} is $${tx.total_amount.toLocaleString()}, significantly above the expected category threshold of $${Math.round(threshold).toLocaleString()}.`,
          entityName: tx.po_number,
          entityType: 'transaction',
          metricValue: `$${tx.total_amount.toLocaleString()}`,
          benchmarkValue: `$${Math.round(threshold).toLocaleString()}`,
          calculationMethod: `Tukey IQR Rule: Q3 ($${q3.toLocaleString()}) + 1.5 × IQR ($${iqr.toLocaleString()}) = $${Math.round(threshold).toLocaleString()}`,
          businessImpact: 'Unusual expenditure spike may indicate unnegotiated emergency spot pricing or invoice errors.',
          recommendedAction: 'Audit line-item bill of materials and confirm whether approval workflow was bypassed.',
          estimatedSaving: Math.round(tx.total_amount - q3),
          relevantRecordIds: [tx.id],
        });
      }
    });
  });

  // ==================================================================
  // 2. Suspected Duplicate PO Detection
  // Matches records with identical supplier, date within 3 days, and identical total_amount
  // ==================================================================
  const seenMap = new Map<string, ProcurementTransaction[]>();

  transactions.forEach((tx) => {
    // Key by supplier and rounded amount
    const key = `${tx.supplier_name}__${Math.round(tx.total_amount)}`;
    const existing = seenMap.get(key) || [];
    existing.push(tx);
    seenMap.set(key, existing);
  });

  seenMap.forEach((txGroup) => {
    if (txGroup.length > 1) {
      // Check if dates are within 3 days of each other
      for (let i = 0; i < txGroup.length; i++) {
        for (let j = i + 1; j < txGroup.length; j++) {
          const t1 = txGroup[i];
          const t2 = txGroup[j];
          const diffDays =
            Math.abs(
              new Date(t1.purchase_date).getTime() - new Date(t2.purchase_date).getTime()
            ) /
            (1000 * 60 * 60 * 24);

          if (diffDays <= 3) {
            insights.push({
              id: `anomaly-dup-${t1.id}-${t2.id}`,
              type: 'duplicate_po',
              severity: 'critical',
              title: `Suspected Duplicate PO: ${t1.po_number} & ${t2.po_number}`,
              description: `Two identical orders of $${t1.total_amount.toLocaleString()} placed with ${t1.supplier_name} within ${Math.round(diffDays)} days (${t1.purchase_date} & ${t2.purchase_date}).`,
              entityName: `${t1.po_number} / ${t2.po_number}`,
              entityType: 'transaction',
              metricValue: `$${t1.total_amount.toLocaleString()} × 2`,
              benchmarkValue: `$${t1.total_amount.toLocaleString()}`,
              calculationMethod: `Exact Match Rule: Supplier + Total Amount identical within 72-hour window`,
              businessImpact: 'High risk of accidental double-payment or dual invoice processing.',
              recommendedAction: 'Check with Accounts Payable to verify whether one PO should be cancelled or credited.',
              estimatedSaving: t2.total_amount,
              relevantRecordIds: [t1.id, t2.id],
            });
          }
        }
      }
    }
  });

  // ==================================================================
  // 3. Department Budget Overruns
  // ==================================================================
  const deptSpend = calculateDepartmentSpend(transactions, budgets);
  deptSpend.forEach((dept) => {
    if (dept.status === 'overrun') {
      insights.push({
        id: `anomaly-bgt-${dept.department}`,
        type: 'budget_overrun',
        severity: 'high',
        title: `Budget Overrun in ${dept.department}`,
        description: `${dept.department} has spent $${dept.spend.toLocaleString()}, exceeding its allocation of $${dept.allocatedBudget.toLocaleString()} (${dept.utilizationPct}% utilization).`,
        entityName: dept.department,
        entityType: 'department',
        metricValue: `${dept.utilizationPct}%`,
        benchmarkValue: '100%',
        calculationMethod: `Variance Rule: Actual Spend ($${dept.spend.toLocaleString()}) - Allocation ($${dept.allocatedBudget.toLocaleString()}) = +$${Math.abs(dept.variance).toLocaleString()}`,
        businessImpact: 'Unchecked spending will deplete departmental fiscal reserves before fiscal year end.',
        recommendedAction: 'Freeze non-essential procurement and require VP signoff for future requisitions.',
        estimatedSaving: Math.abs(dept.variance),
      });
    }
  });

  return insights;
}

/**
 * Generate Actionable Savings Opportunities
 */
export function generateSavingsOpportunities(
  transactions: ProcurementTransaction[]
): SavingsScenario[] {
  const categorySpend = calculateCategorySpend(transactions);
  const scenarios: SavingsScenario[] = [];

  categorySpend.slice(0, 3).forEach((cat) => {
    const estimatedSavingAmount = Math.round(cat.spend * 0.07); // 7% realistic consolidation savings
    scenarios.push({
      id: `sav-${cat.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: `${cat.category} Vendor Consolidation`,
      category: cat.category,
      currentSpend: cat.spend,
      estimatedSavingRate: 0.07,
      estimatedSavingAmount,
      strategy: 'supplier_consolidation',
      rationale: `${cat.category} represents ${cat.percentage.toFixed(1)}% of total expenditure across ${cat.transactionCount} transactions. Consolidating volume to preferred suppliers unlocks tiered discounts.`,
      actionSteps: [
        'Issue RFP to top 2 incumbents for multi-year preferred volume pricing.',
        'Eliminate spot purchasing and mandate enterprise rate cards.',
        'Enforce punch-out catalog ordering to eliminate maverick spend.',
      ],
    });
  });

  return scenarios;
}
