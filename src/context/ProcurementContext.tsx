import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  ProcurementTransaction,
  Budget,
  Supplier,
  SpendFilter,
  CurrencyCode,
  KPISummary,
  MonthlyTrend,
  CategorySpend,
  DepartmentSpend,
  SupplierSpendMetric,
  AnomalyInsight,
  SavingsScenario,
  ImportBatch,
} from '@/types/procurement';
import {
  SAMPLE_SUPPLIERS,
  SAMPLE_BUDGETS,
  INITIAL_SAMPLE_TRANSACTIONS,
} from '@/data/sampleProcurementData';
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
import { generateUUID } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface ProcurementContextType {
  // Raw State
  transactions: ProcurementTransaction[];
  budgets: Budget[];
  suppliers: Supplier[];
  filters: SpendFilter;
  selectedCurrency: CurrencyCode;
  importBatches: ImportBatch[];
  isLoading: boolean;

  // Filtered & Derived Analytics
  filteredTransactions: ProcurementTransaction[];
  kpis: KPISummary;
  monthlyTrends: MonthlyTrend[];
  categorySpend: CategorySpend[];
  departmentSpend: DepartmentSpend[];
  supplierMetrics: SupplierSpendMetric[];
  supplierHHI: {
    hhi: number;
    concentrationCategory: 'Low Concentration' | 'Moderate Concentration' | 'High Concentration';
    top5SharePct: number;
  };
  anomalies: AnomalyInsight[];
  savingsScenarios: SavingsScenario[];

  // Filter Actions
  setFilters: React.Dispatch<React.SetStateAction<SpendFilter>>;
  resetFilters: () => void;
  setCurrency: (curr: CurrencyCode) => void;

  // Data Actions
  importRecords: (
    records: Omit<ProcurementTransaction, 'id' | 'organization_id' | 'created_at'>[],
    filename: string
  ) => Promise<{ successCount: number; batchId: string }>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  resetToDemoData: () => void;
  clearAllData: () => void;
}

const DEFAULT_FILTERS: SpendFilter = {
  startDate: '',
  endDate: '',
  departments: [],
  categories: [],
  suppliers: [],
  paymentStatuses: [],
  deliveryStatuses: [],
  searchQuery: '',
};

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize transactions from localStorage or default sample data
  const [transactions, setTransactions] = useState<ProcurementTransaction[]>(() => {
    const saved = localStorage.getItem('procuresense_transactions');
    return saved ? JSON.parse(saved) : INITIAL_SAMPLE_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('procuresense_budgets');
    return saved ? JSON.parse(saved) : SAMPLE_BUDGETS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('procuresense_suppliers');
    return saved ? JSON.parse(saved) : SAMPLE_SUPPLIERS;
  });

  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => {
    const saved = localStorage.getItem('procuresense_import_batches');
    return saved ? JSON.parse(saved) : [];
  });

  const [filters, setFilters] = useState<SpendFilter>(DEFAULT_FILTERS);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('procuresense_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('procuresense_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('procuresense_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('procuresense_import_batches', JSON.stringify(importBatches));
  }, [importBatches]);

  // If live Supabase is configured and not in demo mode, fetch from cloud
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || isDemoUser || !user) return;

    async function loadCloudData() {
      setIsLoading(true);
      try {
        const { data: txData } = await supabase!
          .from('procurement_transactions')
          .select('*')
          .order('purchase_date', { ascending: false });

        if (txData && txData.length > 0) {
          setTransactions(txData as ProcurementTransaction[]);
        }

        const { data: bgtData } = await supabase!.from('budgets').select('*');
        if (bgtData && bgtData.length > 0) {
          setBudgets(bgtData as Budget[]);
        }

        const { data: supData } = await supabase!.from('suppliers').select('*');
        if (supData && supData.length > 0) {
          setSuppliers(supData as Supplier[]);
        }
      } catch (err) {
        console.error('Failed to load Supabase cloud data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCloudData();
  }, [isDemoUser, user]);

  // Derived Analytics Memoization
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters);
  }, [transactions, filters]);

  const kpis = useMemo(() => {
    return calculateKPISummary(filteredTransactions, transactions, budgets);
  }, [filteredTransactions, transactions, budgets]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(filteredTransactions);
  }, [filteredTransactions]);

  const categorySpend = useMemo(() => {
    return calculateCategorySpend(filteredTransactions);
  }, [filteredTransactions]);

  const departmentSpend = useMemo(() => {
    return calculateDepartmentSpend(filteredTransactions, budgets);
  }, [filteredTransactions, budgets]);

  const supplierMetrics = useMemo(() => {
    return calculateSupplierMetrics(filteredTransactions);
  }, [filteredTransactions]);

  const supplierHHI = useMemo(() => {
    return calculateSupplierHHI(supplierMetrics);
  }, [supplierMetrics]);

  const anomalies = useMemo(() => {
    return detectProcurementAnomalies(filteredTransactions, budgets);
  }, [filteredTransactions, budgets]);

  const savingsScenarios = useMemo(() => {
    return generateSavingsOpportunities(filteredTransactions);
  }, [filteredTransactions]);

  // Actions
  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const setCurrency = (curr: CurrencyCode) => setSelectedCurrency(curr);

  const importRecords = async (
    records: Omit<ProcurementTransaction, 'id' | 'organization_id' | 'created_at'>[],
    filename: string
  ): Promise<{ successCount: number; batchId: string }> => {
    const orgId = user?.organization_id || 'org-demo-01';
    const batchId = generateUUID();

    const newTransactions: ProcurementTransaction[] = records.map((r) => ({
      ...r,
      id: generateUUID(),
      organization_id: orgId,
      import_batch_id: batchId,
      created_at: new Date().toISOString(),
    }));

    const batchRecord: ImportBatch = {
      id: batchId,
      organization_id: orgId,
      filename,
      file_size_bytes: records.length * 128,
      total_records: records.length,
      successful_records: records.length,
      failed_records: 0,
      status: 'completed',
      error_summary: [],
      created_by: user?.id,
      created_at: new Date().toISOString(),
    };

    // If Supabase live, save to database
    if (isSupabaseConfigured && supabase && !isDemoUser) {
      try {
        await supabase.from('import_batches').insert(batchRecord);
        await supabase.from('procurement_transactions').insert(newTransactions);
      } catch (err) {
        console.error('Supabase batch insert error:', err);
      }
    }

    setTransactions((prev) => [...newTransactions, ...prev]);
    setImportBatches((prev) => [batchRecord, ...prev]);

    return { successCount: newTransactions.length, batchId };
  };

  const deleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && supabase && !isDemoUser) {
      await supabase.from('procurement_transactions').delete().eq('id', id);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addBudget = async (
    bgtInput: Omit<Budget, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ) => {
    const orgId = user?.organization_id || 'org-demo-01';
    const newBudget: Budget = {
      ...bgtInput,
      id: generateUUID(),
      organization_id: orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && !isDemoUser) {
      await supabase.from('budgets').insert(newBudget);
    }

    setBudgets((prev) => [...prev, newBudget]);
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (isSupabaseConfigured && supabase && !isDemoUser) {
      await supabase
        .from('budgets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    }
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b))
    );
  };

  const deleteBudget = async (id: string) => {
    if (isSupabaseConfigured && supabase && !isDemoUser) {
      await supabase.from('budgets').delete().eq('id', id);
    }
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const resetToDemoData = () => {
    setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
    setBudgets(SAMPLE_BUDGETS);
    setSuppliers(SAMPLE_SUPPLIERS);
    setFilters(DEFAULT_FILTERS);
    localStorage.removeItem('procuresense_transactions');
    localStorage.removeItem('procuresense_budgets');
    localStorage.removeItem('procuresense_suppliers');
  };

  const clearAllData = () => {
    setTransactions([]);
    setBudgets([]);
    setSuppliers([]);
    setFilters(DEFAULT_FILTERS);
    localStorage.removeItem('procuresense_transactions');
    localStorage.removeItem('procuresense_budgets');
    localStorage.removeItem('procuresense_suppliers');
  };

  return (
    <ProcurementContext.Provider
      value={{
        transactions,
        budgets,
        suppliers,
        filters,
        selectedCurrency,
        importBatches,
        isLoading,
        filteredTransactions,
        kpis,
        monthlyTrends,
        categorySpend,
        departmentSpend,
        supplierMetrics,
        supplierHHI,
        anomalies,
        savingsScenarios,
        setFilters,
        resetFilters,
        setCurrency,
        importRecords,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        resetToDemoData,
        clearAllData,
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurement = () => {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurement must be used within a ProcurementProvider');
  return context;
};
