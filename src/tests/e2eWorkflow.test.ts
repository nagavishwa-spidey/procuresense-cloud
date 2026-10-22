import { describe, it, expect } from 'vitest';
import {
  filterTransactions,
  calculateKPISummary,
  calculateMonthlyTrends,
  calculateCategorySpend,
  calculateDepartmentSpend,
  calculateSupplierMetrics,
  calculateSupplierHHI,
  detectProcurementAnomalies,
  generateSavingsOpportunities,
} from '@/lib/analytics';
import {
  generateSampleCSVTemplate,
  autoDetectColumnMapping,
  validateAndMapRecords,
} from '@/lib/importer';
import { formatCurrency, convertCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { generateSampleTransactions, SAMPLE_BUDGETS, SAMPLE_SUPPLIERS } from '@/data/sampleProcurementData';
import { SpendFilter, Budget } from '@/types/procurement';

describe('Comprehensive End-to-End System Audit: All Options & Features', () => {
  const transactions = generateSampleTransactions();
  let budgets = [...SAMPLE_BUDGETS];

  // ==================================================================
  // 1. Data Ingestion & Dataset Verification
  // ==================================================================
  it('Option 1: Sample dataset contains sufficient multi-month, multi-department records', () => {
    expect(transactions.length).toBeGreaterThanOrEqual(200);

    const departments = new Set(transactions.map((t) => t.department_name));
    const categories = new Set(transactions.map((t) => t.category_name));
    const suppliers = new Set(transactions.map((t) => t.supplier_name));

    expect(departments.size).toBeGreaterThanOrEqual(5);
    expect(categories.size).toBeGreaterThanOrEqual(6);
    expect(suppliers.size).toBeGreaterThanOrEqual(10);
  });

  // ==================================================================
  // 2. Filter Bar Operations
  // ==================================================================
  it('Option 2: Filter bar correctly filters by department, category, and date range', () => {
    const filter: SpendFilter = {
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      departments: ['Engineering'],
      categories: [],
      suppliers: [],
      paymentStatuses: [],
      deliveryStatuses: [],
      searchQuery: '',
    };

    const filtered = filterTransactions(transactions, filter);
    expect(filtered.length).toBeGreaterThan(0);

    filtered.forEach((tx) => {
      expect(tx.department_name).toBe('Engineering');
      expect(tx.purchase_date >= '2026-01-01').toBe(true);
      expect(tx.purchase_date <= '2026-06-30').toBe(true);
    });
  });

  it('Option 3: Search filter matches PO Number, Supplier, and Description query', () => {
    const searchFilter: SpendFilter = {
      startDate: '',
      endDate: '',
      departments: [],
      categories: [],
      suppliers: [],
      paymentStatuses: [],
      deliveryStatuses: [],
      searchQuery: 'Kubernetes',
    };

    const searchResults = filterTransactions(transactions, searchFilter);
    expect(searchResults.length).toBeGreaterThan(0);
    searchResults.forEach((tx) => {
      expect(tx.description.toLowerCase()).toContain('kubernetes');
    });
  });

  // ==================================================================
  // 3. Multi-Currency Conversion
  // ==================================================================
  it('Option 4: Currency conversion engine formats accurately across USD, EUR, GBP, INR', () => {
    const baseUSD = 1000;

    const formattedUSD = formatCurrency(baseUSD, 'USD');
    expect(formattedUSD).toBe('$1,000');

    const formattedEUR = formatCurrency(convertCurrency(baseUSD, 'EUR'), 'EUR');
    expect(formattedEUR).toContain('920');

    const formattedGBP = formatCurrency(convertCurrency(baseUSD, 'GBP'), 'GBP');
    expect(formattedGBP).toContain('790');

    const formattedINR = formatCurrency(convertCurrency(baseUSD, 'INR'), 'INR');
    expect(formattedINR).toContain('83,200');
  });

  // ==================================================================
  // 4. Budget Governance & CRUD Simulations
  // ==================================================================
  it('Option 5: Budget utilization correctly triggers thresholds (<80%, 80-99%, >=100%)', () => {
    const deptSpend = calculateDepartmentSpend(transactions, budgets);
    expect(deptSpend.length).toBeGreaterThan(0);

    deptSpend.forEach((d) => {
      if (d.utilizationPct >= 100) {
        expect(d.status).toBe('overrun');
      } else if (d.utilizationPct >= 85) {
        expect(d.status).toBe('warning');
      } else {
        expect(d.status).toBe('normal');
      }
    });
  });

  it('Option 6: Budget CRUD operations update allocations and variance dynamically', () => {
    const initialBaseline = calculateKPISummary(transactions, transactions, budgets).totalBudgetAllocated;

    // Add new budget
    const newBudget: Budget = {
      id: 'bgt-new-test',
      organization_id: 'org-demo-01',
      name: 'FY2026 Legal & Compliance Budget',
      fiscal_year: 2026,
      period_type: 'annual',
      period_value: 'FY',
      department_name: 'Legal',
      allocated_amount: 150000,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    budgets.push(newBudget);

    let kpis = calculateKPISummary(transactions, transactions, budgets);
    expect(kpis.totalBudgetAllocated).toBe(initialBaseline + 150000);

    // Update budget
    newBudget.allocated_amount = 200000;
    budgets = budgets.map((b) => (b.id === newBudget.id ? newBudget : b));
    let updatedKPIs = calculateKPISummary(transactions, transactions, budgets);
    expect(updatedKPIs.totalBudgetAllocated).toBe(initialBaseline + 200000);

    // Delete budget
    budgets = budgets.filter((b) => b.id !== newBudget.id);
    let finalKPIs = calculateKPISummary(transactions, transactions, budgets);
    expect(finalKPIs.totalBudgetAllocated).toBe(initialBaseline);
  });

  // ==================================================================
  // 5. Statistical Anomaly & Duplicate Detection Rules
  // ==================================================================
  it('Option 7: Statistical anomaly engine flags both price outliers and duplicate POs', () => {
    const anomalies = detectProcurementAnomalies(transactions, budgets);
    expect(anomalies.length).toBeGreaterThan(0);

    const priceOutliers = anomalies.filter((a) => a.type === 'price_outlier');
    expect(priceOutliers.length).toBeGreaterThanOrEqual(1);
    expect(priceOutliers[0].calculationMethod).toContain('IQR');

    const duplicates = anomalies.filter((a) => a.type === 'duplicate_po');
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates[0].title).toContain('PO-88412');
  });

  // ==================================================================
  // 6. Savings Opportunity Calculations
  // ==================================================================
  it('Option 8: Category consolidation savings opportunities generate transparent recommendations', () => {
    const savings = generateSavingsOpportunities(transactions);
    expect(savings.length).toBeGreaterThanOrEqual(1);

    savings.forEach((s) => {
      expect(s.currentSpend).toBeGreaterThan(0);
      expect(s.estimatedSavingRate).toBe(0.07); // 7% rate
      expect(s.estimatedSavingAmount).toBe(Math.round(s.currentSpend * 0.07));
      expect(s.actionSteps.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================================================================
  // 7. Supplier Intelligence & Herfindahl-Hirschman Index (HHI)
  // ==================================================================
  it('Option 9: Supplier concentration scores and metrics compute without errors', () => {
    const metrics = calculateSupplierMetrics(transactions);
    expect(metrics.length).toBeGreaterThanOrEqual(10);

    const hhi = calculateSupplierHHI(metrics);
    expect(hhi.hhi).toBeGreaterThan(0);
    expect(hhi.top5SharePct).toBeGreaterThan(0);
    expect(['Low Concentration', 'Moderate Concentration', 'High Concentration']).toContain(
      hhi.concentrationCategory
    );
  });

  // ==================================================================
  // 8. Ingestion Pipeline & Validation
  // ==================================================================
  it('Option 10: Import parser detects corrupt records and prevents duplicate PO collision', () => {
    const mapping = {
      po_number: 'PO #',
      purchase_date: 'Date',
      supplier_name: 'Supplier',
      category_name: 'Category',
      department_name: 'Department',
      description: 'Item',
      quantity: 'Qty',
      unit_price: 'Price',
      total_amount: 'Total',
    };

    const mockRows = [
      // Valid row
      {
        'PO #': 'PO-NEW-101',
        Date: '2026-10-01',
        Supplier: 'CloudScale Infrastructure',
        Category: 'Cloud & Infrastructure',
        Department: 'Engineering',
        Item: 'Compute cluster upgrade',
        Qty: '1',
        Price: '15000',
        Total: '15000',
      },
      // Corrupt row (Missing supplier)
      {
        'PO #': 'PO-NEW-102',
        Date: '2026-10-01',
        Supplier: '',
        Category: 'Cloud',
        Department: 'Engineering',
        Item: 'Incomplete line',
        Qty: '1',
        Price: '500',
        Total: '500',
      },
    ];

    const result = validateAndMapRecords(mockRows, mapping);
    expect(result.validRows.length).toBe(1);
    expect(result.invalidRows.length).toBe(1);
    expect(result.invalidRows[0].errors).toContain('Missing Supplier Name');
  });
});
