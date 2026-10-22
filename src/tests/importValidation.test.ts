import { describe, it, expect } from 'vitest';
import { autoDetectColumnMapping, validateAndMapRecords, generateSampleCSVTemplate } from '@/lib/importer';

describe('Data Ingestion Pipeline & Validation', () => {
  it('generates a valid, non-empty CSV sample template', () => {
    const template = generateSampleCSVTemplate();
    expect(template).toContain('PO Number');
    expect(template).toContain('Supplier Name');
    expect(template).toContain('Total Amount');
    expect(template.split('\n').length).toBeGreaterThan(3);
  });

  it('correctly maps various header synonyms to canonical fields', () => {
    const rawHeaders = [
      'Order ID',
      'Order Date',
      'Vendor Name',
      'Item Category',
      'Cost Center',
      'Item Description',
      'Units',
      'Price Per Unit',
      'Net Amount',
    ];

    const mapping = autoDetectColumnMapping(rawHeaders);
    expect(mapping.po_number).toBe('Order ID');
    expect(mapping.purchase_date).toBe('Order Date');
    expect(mapping.supplier_name).toBe('Vendor Name');
    expect(mapping.category_name).toBe('Item Category');
    expect(mapping.department_name).toBe('Cost Center');
    expect(mapping.description).toBe('Item Description');
    expect(mapping.quantity).toBe('Units');
    expect(mapping.unit_price).toBe('Price Per Unit');
    expect(mapping.total_amount).toBe('Net Amount');
  });

  it('validates records and filters out invalid or corrupt rows', () => {
    const mapping = {
      po_number: 'PO Number',
      purchase_date: 'Date',
      supplier_name: 'Vendor',
      category_name: 'Category',
      department_name: 'Dept',
      description: 'Desc',
      quantity: 'Qty',
      unit_price: 'Price',
      total_amount: 'Amount',
    };

    const rows = [
      // Valid row
      {
        'PO Number': 'PO-TEST-1',
        Date: '2026-09-01',
        Vendor: 'Test Vendor',
        Category: 'IT',
        Dept: 'Engineering',
        Desc: 'Valid monitor purchase',
        Qty: '2',
        Price: '300',
        Amount: '600',
      },
      // Corrupt row (Missing PO Number)
      {
        'PO Number': '',
        Date: '2026-09-01',
        Vendor: 'Test Vendor',
        Category: 'IT',
        Dept: 'Engineering',
        Desc: 'Invalid item',
        Qty: '1',
        Price: '100',
        Amount: '100',
      },
      // Duplicate PO row (PO-TEST-1 repeated)
      {
        'PO Number': 'PO-TEST-1',
        Date: '2026-09-02',
        Vendor: 'Test Vendor',
        Category: 'IT',
        Dept: 'Engineering',
        Desc: 'Duplicate PO',
        Qty: '1',
        Price: '600',
        Amount: '600',
      },
    ];

    const result = validateAndMapRecords(rows, mapping);
    expect(result.validRows.length).toBe(1);
    expect(result.validRows[0].po_number).toBe('PO-TEST-1');
    expect(result.invalidRows.length).toBe(2);
    expect(result.detectedDuplicates).toBe(1);
  });
});
