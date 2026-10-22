import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProcurementProvider } from '@/context/ProcurementContext';
import { Header } from '@/components/common/Header';
import { Sidebar, NavTab } from '@/components/common/Sidebar';
import { ImportWizard } from '@/components/import/ImportWizard';

// Page components
import { Dashboard } from '@/pages/Dashboard';
import { SpendAnalysis } from '@/pages/SpendAnalysis';
import { SupplierIntelligence } from '@/pages/SupplierIntelligence';
import { BudgetManagement } from '@/pages/BudgetManagement';
import { SavingsInsights } from '@/pages/SavingsInsights';
import { DataImport } from '@/pages/DataImport';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { AuthPage } from '@/pages/AuthPage';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  // If not logged in, render corporate login page
  if (!user) {
    return <AuthPage onSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header onOpenImport={() => setIsImportWizardOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenImport={() => setIsImportWizardOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'spend' && <SpendAnalysis />}

          {activeTab === 'suppliers' && <SupplierIntelligence />}

          {activeTab === 'budgets' && <BudgetManagement />}

          {activeTab === 'insights' && <SavingsInsights />}

          {activeTab === 'import' && (
            <DataImport onOpenWizard={() => setIsImportWizardOpen(true)} />
          )}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Import Wizard Modal */}
      <ImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ProcurementProvider>
        <AppContent />
      </ProcurementProvider>
    </AuthProvider>
  );
}

export default App;
