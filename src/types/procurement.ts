import { z } from 'zod';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // For multi-currency estimation
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateAgainstUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateAgainstUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateAgainstUSD: 0.79 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateAgainstUSD: 83.2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateAgainstUSD: 1.35 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateAgainstUSD: 1.52 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateAgainstUSD: 154.5 },
};

// ====================================================================
// Core Domain Entities
// ====================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  default_currency: CurrencyCode;
  fiscal_year_start: number; // 1-12
  budget_alert_thresholds: {
    warning: number;   // e.g. 80%
    critical: number;  // e.g. 90%
    overrun: number;   // e.g. 100%
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  avatar_url?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  contact_email?: string;
  contact_phone?: string;
  country: string;
  category_tag?: string;
  payment_terms?: string;
  tax_id?: string;
  status: 'active' | 'inactive' | 'preferred' | 'under_review';
  created_at: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';
export type DeliveryStatus = 'delivered' | 'in_transit' | 'pending' | 'delayed' | 'cancelled';

export interface ProcurementTransaction {
  id: string;
  organization_id: string;
  po_number: string;
  purchase_date: string; // YYYY-MM-DD
  supplier_id?: string;
  supplier_name: string;
  category_id?: string;
  category_name: string;
  department_id?: string;
  department_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: CurrencyCode;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  contract_ref?: string;
  invoice_ref?: string;
  notes?: string;
  import_batch_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  organization_id: string;
  name: string;
  fiscal_year: number;
  period_type: 'annual' | 'quarterly' | 'monthly';
  period_value: string; // 'FY', 'Q1'..'Q4', '01'..'12'
  department_name?: string;
  category_name?: string;
  allocated_amount: number;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
}

export interface ImportBatch {
  id: string;
  organization_id: string;
  filename: string;
  file_size_bytes: number;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: 'processing' | 'completed' | 'failed' | 'partially_completed';
  error_summary: Array<{ row: number; error: string; raw: any }>;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  created_at: string;
}

// ====================================================================
// Validation Schemas (Zod)
// ====================================================================

export const TransactionInputSchema = z.object({
  po_number: z.string().min(1, 'PO Number is required').max(100),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  category_name: z.string().min(1, 'Category is required'),
  department_name: z.string().min(1, 'Department is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit_price: z.number().nonnegative('Unit price must be positive or zero'),
  total_amount: z.number().positive('Total amount must be greater than zero'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']).default('USD'),
  payment_status: z.enum(['paid', 'pending', 'overdue', 'cancelled']).default('paid'),
  delivery_status: z.enum(['delivered', 'in_transit', 'pending', 'delayed', 'cancelled']).default('delivered'),
  contract_ref: z.string().optional(),
  invoice_ref: z.string().optional(),
  notes: z.string().optional(),
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;

export const BudgetInputSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  fiscal_year: z.number().int().min(2000).max(2100),
  period_type: z.enum(['annual', 'quarterly', 'monthly']),
  period_value: z.string().min(1, 'Period value is required'),
  department_name: z.string().optional(),
  category_name: z.string().optional(),
  allocated_amount: z.number().positive('Allocated amount must be greater than zero'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']).default('USD'),
});

export type BudgetInput = z.infer<typeof BudgetInputSchema>;

// ====================================================================
// Analytics & Reporting Types
// ====================================================================

export interface SpendFilter {
  startDate: string;
  endDate: string;
  departments: string[];
  categories: string[];
  suppliers: string[];
  paymentStatuses: PaymentStatus[];
  deliveryStatuses: DeliveryStatus[];
  searchQuery: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface KPISummary {
  totalSpend: number;
  totalTransactions: number;
  activeSuppliersCount: number;
  categoriesCount: number;
  averagePOValue: number;
  budgetUtilizationPct: number;
  totalBudgetAllocated: number;
  momSpendChangePct: number;
  potentialSavingsEstimate: number;
}

export interface MonthlyTrend {
  monthKey: string; // '2026-01'
  label: string;    // 'Jan 2026'
  totalSpend: number;
  transactionCount: number;
  previousPeriodSpend?: number;
}

export interface CategorySpend {
  category: string;
  spend: number;
  percentage: number;
  transactionCount: number;
  paretoCumulativePct?: number;
  isParetoTop80?: boolean;
}

export interface DepartmentSpend {
  department: string;
  spend: number;
  allocatedBudget: number;
  variance: number;
  utilizationPct: number;
  status: 'normal' | 'warning' | 'overrun';
}

export interface SupplierSpendMetric {
  supplier: string;
  spend: number;
  percentage: number;
  orderCount: number;
  averageOrderValue: number;
  onTimeDeliveryPct: number;
  performanceScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface AnomalyInsight {
  id: string;
  type: 'price_outlier' | 'duplicate_po' | 'supplier_dependency' | 'budget_overrun' | 'maverick_spend' | 'category_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityName: string;
  entityType: 'transaction' | 'supplier' | 'department' | 'category';
  metricValue: string | number;
  benchmarkValue: string | number;
  calculationMethod: string;
  businessImpact: string;
  recommendedAction: string;
  estimatedSaving?: number;
  relevantRecordIds?: string[];
}

export interface SavingsScenario {
  id: string;
  title: string;
  category: string;
  currentSpend: number;
  estimatedSavingRate: number; // e.g. 0.06 (6%)
  estimatedSavingAmount: number;
  strategy: 'supplier_consolidation' | 'bulk_negotiation' | 'early_payment_discount' | 'contract_compliance';
  rationale: string;
  actionSteps: string[];
}
