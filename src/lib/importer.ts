import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { TransactionInputSchema, type TransactionInput, type CurrencyCode } from '@/types/procurement';

export interface ColumnMapping {
  po_number: string;
  purchase_date: string;
  supplier_name: string;
  category_name: string;
  department_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  total_amount: string;
  currency?: string;
  payment_status?: string;
  delivery_status?: string;
  contract_ref?: string;
  invoice_ref?: string;
}

export interface ImportErrorRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
}

export interface ImportParseResult {
  headers: string[];
  suggestedMapping: ColumnMapping;
  totalRows: number;
  validRows: TransactionInput[];
  invalidRows: ImportErrorRow[];
  detectedDuplicates: number;
  previewRows: Record<string, any>[];
}

/**
 * Generate standard Sample CSV Template content
 */
export function generateSampleCSVTemplate(): string {
  const headers = [
    'PO Number',
    'Purchase Date',
    'Supplier Name',
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

  const sampleRows = [
    ['PO-99001', '2026-09-01', 'CloudScale Infrastructure', 'Cloud & Infrastructure', 'Information Technology', 'Kubernetes Cluster Compute Nodes', '1', '14500.00', '14500.00', 'USD', 'paid', 'delivered', 'CNT-CSI-2026', 'INV-5501'],
    ['PO-99002', '2026-09-05', 'Apex Software Systems', 'SaaS & Software', 'Engineering', 'Developer IDE Licenses (50 Seats)', '50', '45.00', '2250.00', 'USD', 'paid', 'delivered', 'CNT-ASS-DEV', 'INV-5502'],
    ['PO-99003', '2026-09-12', 'Workplace Essentials Ltd', 'Office Supplies & Facilities', 'Facilities', 'Standing Desks & Ergonomic Chairs', '10', '350.00', '3500.00', 'USD', 'pending', 'delivered', 'WKE-FAC-01', 'INV-5503'],
    ['PO-99004', '2026-09-18', 'Precision Tooling & Hardware', 'Hardware & Equipment', 'Operations', 'Calibration Sensors & Test Kit', '4', '1200.00', '4800.00', 'USD', 'paid', 'in_transit', 'PTH-HDW-09', 'INV-5504'],
    ['PO-99005', '2026-09-25', 'Starlight Media & Creative', 'Marketing & Advertising', 'Marketing & Growth', 'Product Launch Video Production', '1', '12500.00', '12500.00', 'USD', 'paid', 'delivered', 'MKT-SMC-26', 'INV-5505'],
  ];

  return [
    headers.join(','),
    ...sampleRows.map((r) => r.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',')),
  ].join('\n');
}

/**
 * Intelligent Column Name Matcher
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const lowerMap = new Map<string, string>();
  headers.forEach((h) => lowerMap.set(h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''), h));

  const findHeader = (candidates: string[]): string => {
    for (const c of candidates) {
      const normalized = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerMap.has(normalized)) {
        return lowerMap.get(normalized)!;
      }
    }
    // Partial substring match
    for (const c of candidates) {
      const normalized = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [k, v] of lowerMap.entries()) {
        if (k.includes(normalized) || normalized.includes(k)) {
          return v;
        }
      }
    }
    return '';
  };

  return {
    po_number: findHeader(['po_number', 'ponumber', 'po#', 'order_id', 'poid', 'order_number', 'po']),
    purchase_date: findHeader(['purchase_date', 'purchasedate', 'date', 'order_date', 'podate']),
    supplier_name: findHeader(['supplier_name', 'supplier', 'vendor', 'vendor_name', 'suppliername']),
    category_name: findHeader(['category_name', 'category', 'spend_category', 'item_category']),
    department_name: findHeader(['department_name', 'department', 'dept', 'cost_center', 'departmentname']),
    description: findHeader(['description', 'item_description', 'product', 'item', 'details', 'name']),
    quantity: findHeader(['quantity', 'qty', 'units', 'count']),
    unit_price: findHeader(['unit_price', 'unitprice', 'price', 'rate', 'cost_per_unit']),
    total_amount: findHeader(['total_amount', 'totalamount', 'total', 'amount', 'spend', 'net_amount', 'line_total']),
    currency: findHeader(['currency', 'curr']),
    payment_status: findHeader(['payment_status', 'paymentstatus', 'paid_status', 'payment']),
    delivery_status: findHeader(['delivery_status', 'deliverystatus', 'shipping_status', 'delivery']),
    contract_ref: findHeader(['contract_ref', 'contract', 'contract_id', 'msa']),
    invoice_ref: findHeader(['invoice_ref', 'invoice', 'invoice_number', 'invoice_id']),
  };
}

/**
 * Process Raw Records into validated domain records using column mapping
 */
export function validateAndMapRecords(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingPoNumbers: Set<string> = new Set()
): {
  validRows: TransactionInput[];
  invalidRows: ImportErrorRow[];
  detectedDuplicates: number;
} {
  const validRows: TransactionInput[] = [];
  const invalidRows: ImportErrorRow[] = [];
  let detectedDuplicates = 0;
  const seenInBatch = new Set<string>();

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2; // Accounting for 1-based index and header row
    const rowErrors: string[] = [];

    // Extract fields via mapping
    const po = String(row[mapping.po_number] || '').trim();
    const dateRaw = String(row[mapping.purchase_date] || '').trim();
    const supplier = String(row[mapping.supplier_name] || '').trim();
    const category = String(row[mapping.category_name] || '').trim();
    const dept = String(row[mapping.department_name] || '').trim();
    const desc = String(row[mapping.description] || '').trim();
    const qtyStr = String(row[mapping.quantity] || '1').replace(/[^0-9.]/g, '');
    const priceStr = String(row[mapping.unit_price] || '0').replace(/[^0-9.]/g, '');
    const amountStr = String(row[mapping.total_amount] || '').replace(/[^0-9.]/g, '');
    const currencyRaw = mapping.currency ? String(row[mapping.currency] || 'USD').trim().toUpperCase() : 'USD';
    const payStatusRaw = mapping.payment_status ? String(row[mapping.payment_status] || 'paid').toLowerCase().trim() : 'paid';
    const delStatusRaw = mapping.delivery_status ? String(row[mapping.delivery_status] || 'delivered').toLowerCase().trim() : 'delivered';

    if (!po) rowErrors.push('Missing PO Number');
    if (!supplier) rowErrors.push('Missing Supplier Name');
    if (!category) rowErrors.push('Missing Category');
    if (!dept) rowErrors.push('Missing Department');
    if (!desc) rowErrors.push('Missing Description');

    // Duplicate checks
    if (po) {
      if (existingPoNumbers.has(po) || seenInBatch.has(po)) {
        detectedDuplicates++;
        rowErrors.push(`Duplicate PO Number (${po}) already exists`);
      } else {
        seenInBatch.add(po);
      }
    }

    // Parse date (support YYYY-MM-DD, MM/DD/YYYY, Excel serial dates)
    let formattedDate = dateRaw;
    if (dateRaw.includes('/')) {
      const parts = dateRaw.split('/');
      if (parts.length === 3) {
        // MM/DD/YYYY
        formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    } else if (!isNaN(Number(dateRaw)) && Number(dateRaw) > 20000) {
      // Excel serial date number
      const dateObj = new Date((Number(dateRaw) - 25569) * 86400 * 1000);
      formattedDate = dateObj.toISOString().split('T')[0];
    }

    const qty = parseFloat(qtyStr) || 1;
    let unitPrice = parseFloat(priceStr) || 0;
    let totalAmount = parseFloat(amountStr) || (qty * unitPrice);

    if (totalAmount <= 0) {
      rowErrors.push('Total Amount must be greater than zero');
    }

    // Normalize currencies
    const allowedCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'];
    const currency = (allowedCurrencies.includes(currencyRaw as CurrencyCode) ? currencyRaw : 'USD') as CurrencyCode;

    // Normalize payment status
    const allowedPayment = ['paid', 'pending', 'overdue', 'cancelled'];
    const paymentStatus = (allowedPayment.includes(payStatusRaw) ? payStatusRaw : 'paid') as any;

    // Normalize delivery status
    const allowedDelivery = ['delivered', 'in_transit', 'pending', 'delayed', 'cancelled'];
    const deliveryStatus = (allowedDelivery.includes(delStatusRaw) ? delStatusRaw : 'delivered') as any;

    const recordCandidate = {
      po_number: po,
      purchase_date: formattedDate,
      supplier_name: supplier,
      category_name: category,
      department_name: dept,
      description: desc,
      quantity: qty,
      unit_price: unitPrice,
      total_amount: totalAmount,
      currency,
      payment_status: paymentStatus,
      delivery_status: deliveryStatus,
      contract_ref: mapping.contract_ref ? String(row[mapping.contract_ref] || '').trim() || undefined : undefined,
      invoice_ref: mapping.invoice_ref ? String(row[mapping.invoice_ref] || '').trim() || undefined : undefined,
    };

    // Zod schema check
    const parseResult = TransactionInputSchema.safeParse(recordCandidate);
    if (!parseResult.success) {
      parseResult.error.issues.forEach((err) => rowErrors.push(`${err.path.join('.')}: ${err.message}`));
    }

    if (rowErrors.length > 0) {
      invalidRows.push({
        rowIndex,
        data: row,
        errors: rowErrors,
      });
    } else {
      validRows.push(recordCandidate as TransactionInput);
    }
  });

  return { validRows, invalidRows, detectedDuplicates };
}

/**
 * Parse File (CSV or Excel) into raw row objects
 */
export async function parseProcurementFile(file: File): Promise<{
  headers: string[];
  rows: Record<string, any>[];
}> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });

    if (rawData.length === 0) {
      throw new Error('The uploaded Excel sheet is empty.');
    }

    const headers = (rawData[0] as string[]).map((h) => String(h || '').trim());
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
    return { headers, rows };
  } else {
    // CSV with PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            reject(new Error(`CSV parse error: ${results.errors[0].message}`));
            return;
          }
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, any>[];
          resolve({ headers, rows });
        },
        error: (err) => reject(err),
      });
    });
  }
}
