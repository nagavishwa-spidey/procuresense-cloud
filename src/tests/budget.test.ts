import { describe, it, expect } from 'vitest';
import { calculateDepartmentSpend } from '@/lib/analytics';
import { ProcurementTransaction, Budget } from '@/types/procurement';

describe('Budget Variance & Utilization Analytics', () => {
  const mockBudgets: Budget[] = [
    {
      id: 'b-eng',
      organization_id: 'org-1',
      name: 'Engineering Budget',
      fiscal_year: 2026,
      period_type: 'annual',
      period_value: 'FY',
      department_name: 'Engineering',
      allocated_amount: 100000,
      currency: 'USD',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'b-mkt',
      organization_id: 'org-1',
      name: 'Marketing Budget',
      fiscal_year: 2026,
      period_type: 'annual',
      period_value: 'FY',
      department_name: 'Marketing',
      allocated_amount: 50000,
      currency: 'USD',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('correctly categorizes department budget health status', () => {
    const transactions: ProcurementTransaction[] = [
      // Engineering spend: $60,000 / $100,000 = 60% (Normal)
      {
        id: 'tx-1',
        organization_id: 'org-1',
        po_number: 'PO-1',
        purchase_date: '2026-08-01',
        supplier_name: 'Vendor A',
        category_name: 'Cloud',
        department_name: 'Engineering',
        description: 'Cloud',
        quantity: 1,
        unit_price: 60000,
        total_amount: 60000,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-01T00:00:00Z',
      },
      // Marketing spend: $55,000 / $50,000 = 110% (Overrun)
      {
        id: 'tx-2',
        organization_id: 'org-1',
        po_number: 'PO-2',
        purchase_date: '2026-08-05',
        supplier_name: 'Vendor B',
        category_name: 'Ads',
        department_name: 'Marketing',
        description: 'Ad campaign',
        quantity: 1,
        unit_price: 55000,
        total_amount: 55000,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-05T00:00:00Z',
      },
    ];

    const deptSpend = calculateDepartmentSpend(transactions, mockBudgets);

    const eng = deptSpend.find((d) => d.department === 'Engineering')!;
    expect(eng.spend).toBe(60000);
    expect(eng.allocatedBudget).toBe(100000);
    expect(eng.variance).toBe(40000);
    expect(eng.utilizationPct).toBe(60);
    expect(eng.status).toBe('normal');

    const mkt = deptSpend.find((d) => d.department === 'Marketing')!;
    expect(mkt.spend).toBe(55000);
    expect(mkt.allocatedBudget).toBe(50000);
    expect(mkt.variance).toBe(-5000);
    expect(mkt.utilizationPct).toBe(110);
    expect(mkt.status).toBe('overrun');
  });
});
