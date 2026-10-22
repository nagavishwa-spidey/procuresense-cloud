import { describe, it, expect } from 'vitest';
import {
  calculateKPISummary,
  calculateMonthlyTrends,
  calculateCategorySpend,
  calculateSupplierMetrics,
  calculateSupplierHHI,
} from '@/lib/analytics';
import { ProcurementTransaction, Budget } from '@/types/procurement';

describe('Procurement Analytics Calculations', () => {
  const mockTransactions: ProcurementTransaction[] = [
    {
      id: 'tx-1',
      organization_id: 'org-1',
      po_number: 'PO-101',
      purchase_date: '2026-08-01',
      supplier_name: 'Alpha Corp',
      category_name: 'Software',
      department_name: 'Engineering',
      description: 'Dev tools',
      quantity: 1,
      unit_price: 10000,
      total_amount: 10000,
      currency: 'USD',
      payment_status: 'paid',
      delivery_status: 'delivered',
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      organization_id: 'org-1',
      po_number: 'PO-102',
      purchase_date: '2026-08-15',
      supplier_name: 'Alpha Corp',
      category_name: 'Software',
      department_name: 'Engineering',
      description: 'Cloud storage',
      quantity: 1,
      unit_price: 20000,
      total_amount: 20000,
      currency: 'USD',
      payment_status: 'paid',
      delivery_status: 'delivered',
      created_at: '2026-08-15T00:00:00Z',
    },
    {
      id: 'tx-3',
      organization_id: 'org-1',
      po_number: 'PO-103',
      purchase_date: '2026-09-05',
      supplier_name: 'Beta Logistics',
      category_name: 'Logistics',
      department_name: 'Operations',
      description: 'Shipping freight',
      quantity: 2,
      unit_price: 5000,
      total_amount: 10000,
      currency: 'USD',
      payment_status: 'pending',
      delivery_status: 'in_transit',
      created_at: '2026-09-05T00:00:00Z',
    },
  ];

  const mockBudgets: Budget[] = [
    {
      id: 'b-1',
      organization_id: 'org-1',
      name: 'Engineering Budget',
      fiscal_year: 2026,
      period_type: 'annual',
      period_value: 'FY',
      department_name: 'Engineering',
      allocated_amount: 50000,
      currency: 'USD',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('correctly calculates total spend, average PO value, and active supplier count', () => {
    const kpi = calculateKPISummary(mockTransactions, mockTransactions, mockBudgets);
    expect(kpi.totalSpend).toBe(40000);
    expect(kpi.totalTransactions).toBe(3);
    expect(kpi.activeSuppliersCount).toBe(2);
    expect(kpi.categoriesCount).toBe(2);
    expect(kpi.averagePOValue).toBeCloseTo(40000 / 3, 2);
    expect(kpi.budgetUtilizationPct).toBe(80); // 40k / 50k = 80%
  });

  it('correctly generates monthly spend trajectories', () => {
    const trends = calculateMonthlyTrends(mockTransactions);
    expect(trends.length).toBe(2);
    expect(trends[0].monthKey).toBe('2026-08');
    expect(trends[0].totalSpend).toBe(30000);
    expect(trends[1].monthKey).toBe('2026-09');
    expect(trends[1].totalSpend).toBe(10000);
  });

  it('computes category spend and Pareto cumulative percentages accurately', () => {
    const catSpend = calculateCategorySpend(mockTransactions);
    expect(catSpend.length).toBe(2);
    expect(catSpend[0].category).toBe('Software');
    expect(catSpend[0].spend).toBe(30000);
    expect(catSpend[0].percentage).toBe(75);
    expect(catSpend[0].isParetoTop80).toBe(true);

    expect(catSpend[1].category).toBe('Logistics');
    expect(catSpend[1].spend).toBe(10000);
    expect(catSpend[1].percentage).toBe(25);
    expect(catSpend[1].paretoCumulativePct).toBe(100);
  });

  it('computes Herfindahl-Hirschman Index (HHI) for supplier market concentration', () => {
    const supMetrics = calculateSupplierMetrics(mockTransactions);
    const hhiResult = calculateSupplierHHI(supMetrics);

    // Alpha Corp has 75% market share, Beta Logistics has 25%
    // HHI = 75^2 + 25^2 = 5625 + 625 = 6250
    expect(hhiResult.hhi).toBe(6250);
    expect(hhiResult.concentrationCategory).toBe('High Concentration');
  });
});
