import { describe, it, expect } from 'vitest';
import { detectProcurementAnomalies } from '@/lib/analytics';
import { ProcurementTransaction, Budget } from '@/types/procurement';

describe('Procurement Anomaly & Fraud Detection Engine', () => {
  it('detects extreme statistical spend outliers using the Tukey IQR rule', () => {
    // 6 normal transactions in Hardware ($1,000 to $2,500), and 1 extreme outlier ($85,000)
    const transactions: ProcurementTransaction[] = [
      {
        id: 'tx-1',
        organization_id: 'org-1',
        po_number: 'PO-001',
        purchase_date: '2026-08-01',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Sensors',
        quantity: 1,
        unit_price: 1000,
        total_amount: 1000,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'tx-2',
        organization_id: 'org-1',
        po_number: 'PO-002',
        purchase_date: '2026-08-02',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Sensors',
        quantity: 1,
        unit_price: 1200,
        total_amount: 1200,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-02T00:00:00Z',
      },
      {
        id: 'tx-3',
        organization_id: 'org-1',
        po_number: 'PO-003',
        purchase_date: '2026-08-03',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Sensors',
        quantity: 1,
        unit_price: 1500,
        total_amount: 1500,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-03T00:00:00Z',
      },
      {
        id: 'tx-4',
        organization_id: 'org-1',
        po_number: 'PO-004',
        purchase_date: '2026-08-04',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Sensors',
        quantity: 1,
        unit_price: 1800,
        total_amount: 1800,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-04T00:00:00Z',
      },
      {
        id: 'tx-5',
        organization_id: 'org-1',
        po_number: 'PO-005',
        purchase_date: '2026-08-05',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Sensors',
        quantity: 1,
        unit_price: 2000,
        total_amount: 2000,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-05T00:00:00Z',
      },
      // Massive Outlier
      {
        id: 'tx-outlier',
        organization_id: 'org-1',
        po_number: 'PO-999',
        purchase_date: '2026-08-06',
        supplier_name: 'Hardware Co',
        category_name: 'Hardware',
        department_name: 'Engineering',
        description: 'Unexpected custom mainframes',
        quantity: 1,
        unit_price: 85000,
        total_amount: 85000,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-08-06T00:00:00Z',
      },
    ];

    const anomalies = detectProcurementAnomalies(transactions, []);
    const priceOutliers = anomalies.filter((a) => a.type === 'price_outlier');

    expect(priceOutliers.length).toBeGreaterThanOrEqual(1);
    expect(priceOutliers[0].entityName).toBe('PO-999');
    expect(priceOutliers[0].calculationMethod).toContain('IQR');
  });

  it('detects suspected duplicate purchase orders placed within a 72-hour window', () => {
    const transactions: ProcurementTransaction[] = [
      {
        id: 'tx-dup-1',
        organization_id: 'org-1',
        po_number: 'PO-501',
        purchase_date: '2026-09-10',
        supplier_name: 'Design Agency Pro',
        category_name: 'Marketing',
        department_name: 'Marketing',
        description: 'Branding Retainer',
        quantity: 1,
        unit_price: 12500,
        total_amount: 12500,
        currency: 'USD',
        payment_status: 'paid',
        delivery_status: 'delivered',
        created_at: '2026-09-10T00:00:00Z',
      },
      {
        id: 'tx-dup-2',
        organization_id: 'org-1',
        po_number: 'PO-502',
        purchase_date: '2026-09-11', // 1 day apart
        supplier_name: 'Design Agency Pro',
        category_name: 'Marketing',
        department_name: 'Marketing',
        description: 'Branding Retainer [DUPLICATE]',
        quantity: 1,
        unit_price: 12500,
        total_amount: 12500,
        currency: 'USD',
        payment_status: 'pending',
        delivery_status: 'delivered',
        created_at: '2026-09-11T00:00:00Z',
      },
    ];

    const anomalies = detectProcurementAnomalies(transactions, []);
    const dupAlerts = anomalies.filter((a) => a.type === 'duplicate_po');

    expect(dupAlerts.length).toBe(1);
    expect(dupAlerts[0].title).toContain('PO-501 & PO-502');
    expect(dupAlerts[0].severity).toBe('critical');
  });
});
