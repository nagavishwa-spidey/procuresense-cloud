import * as XLSX from 'xlsx';
import { ProcurementTransaction, Budget, KPISummary } from '@/types/procurement';
import { calculateCategorySpend, calculateSupplierMetrics, calculateDepartmentSpend } from './analytics';

/**
 * Download a string payload as a browser file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Transactions to standard CSV
 */
export function exportTransactionsToCSV(
  transactions: ProcurementTransaction[],
  filename: string = `procuresense_transactions_${new Date().toISOString().split('T')[0]}.csv`
) {
  const headers = [
    'PO Number',
    'Date',
    'Supplier',
    'Category',
    'Department',
    'Description',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'Currency',
    'Payment Status',
    'Delivery Status',
    'Contract Ref',
    'Invoice Ref',
  ];

  const rows = transactions.map((t) => [
    t.po_number,
    t.purchase_date,
    t.supplier_name,
    t.category_name,
    t.department_name,
    t.description,
    t.quantity,
    t.unit_price,
    t.total_amount,
    t.currency,
    t.payment_status,
    t.delivery_status,
    t.contract_ref || '',
    t.invoice_ref || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, filename);
}

/**
 * Export Multi-Sheet Comprehensive Excel Workbook
 */
export function exportProcurementWorkbook(
  transactions: ProcurementTransaction[],
  budgets: Budget[],
  kpis: KPISummary,
  filename: string = `ProcureSense_Enterprise_Report_${new Date().toISOString().split('T')[0]}.xlsx`
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive KPI Summary
  const kpiData = [
    ['ProcureSense Cloud - Executive Spend Report', ''],
    ['Generated At', new Date().toLocaleString()],
    ['', ''],
    ['Metric', 'Value'],
    ['Total Procurement Expenditure', kpis.totalSpend],
    ['Total Transactions Processed', kpis.totalTransactions],
    ['Active Supplier Count', kpis.activeSuppliersCount],
    ['Active Spend Categories', kpis.categoriesCount],
    ['Average PO Value', Math.round(kpis.averagePOValue)],
    ['Total Budget Allocation', kpis.totalBudgetAllocated],
    ['Budget Utilization Rate (%)', `${kpis.budgetUtilizationPct.toFixed(1)}%`],
    ['Month-over-Month Change (%)', `${kpis.momSpendChangePct.toFixed(1)}%`],
    ['Potential Identified Savings (Est.)', kpis.potentialSavingsEstimate],
  ];
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Executive Summary');

  // Sheet 2: Category Breakdown
  const catSpend = calculateCategorySpend(transactions);
  const catData = [
    ['Category', 'Spend ($)', 'Share of Spend (%)', 'Transaction Count', 'Pareto Cumulative (%)'],
    ...catSpend.map((c) => [c.category, c.spend, c.percentage.toFixed(1), c.transactionCount, c.paretoCumulativePct]),
  ];
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Category Spend');

  // Sheet 3: Department Budget Variance
  const deptSpend = calculateDepartmentSpend(transactions, budgets);
  const deptData = [
    ['Department', 'Actual Spend ($)', 'Allocated Budget ($)', 'Variance ($)', 'Utilization (%)', 'Status'],
    ...deptSpend.map((d) => [d.department, d.spend, d.allocatedBudget, d.variance, `${d.utilizationPct}%`, d.status.toUpperCase()]),
  ];
  const wsDept = XLSX.utils.aoa_to_sheet(deptData);
  XLSX.utils.book_append_sheet(wb, wsDept, 'Department Variance');

  // Sheet 4: Supplier Performance & Spend
  const supMetrics = calculateSupplierMetrics(transactions);
  const supData = [
    ['Supplier Name', 'Total Spend ($)', 'Spend Share (%)', 'Order Count', 'Average Order ($)', 'On-Time Delivery (%)', 'Performance Score', 'Risk Level'],
    ...supMetrics.map((s) => [s.supplier, s.spend, s.percentage, s.orderCount, s.averageOrderValue, s.onTimeDeliveryPct, s.performanceScore, s.riskLevel]),
  ];
  const wsSup = XLSX.utils.aoa_to_sheet(supData);
  XLSX.utils.book_append_sheet(wb, wsSup, 'Supplier Intelligence');

  // Sheet 5: Line-item Transactions
  const txData = [
    ['PO Number', 'Date', 'Supplier', 'Category', 'Department', 'Description', 'Qty', 'Unit Price', 'Total Amount', 'Status'],
    ...transactions.map((t) => [
      t.po_number,
      t.purchase_date,
      t.supplier_name,
      t.category_name,
      t.department_name,
      t.description,
      t.quantity,
      t.unit_price,
      t.total_amount,
      t.payment_status,
    ]),
  ];
  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // Generate Excel file
  XLSX.writeFile(wb, filename);
}
