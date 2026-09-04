import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { OverviewDashboard } from './components/OverviewDashboard.tsx';
import { RecoveryCasesPage } from './components/RecoveryCasesPage.tsx';
import { CaseDetailsPage } from './components/CaseDetailsPage.tsx';
import { AgentActivityPage } from './components/AgentActivityPage.tsx';
import { AuditTrailPage } from './components/AuditTrailPage.tsx';
import { AnalyticsPage } from './components/AnalyticsPage.tsx';
import { PoliciesPage } from './components/PoliciesPage.tsx';
import { SettingsDemoPage } from './components/SettingsDemoPage.tsx';
import { EngineeringNotesPage } from './components/EngineeringNotesPage.tsx';
import { BatchProcessingModal } from './components/BatchProcessingModal.tsx';
import { ScenarioModal } from './components/ScenarioModal.tsx';
import { api } from './api.ts';
import {
  DashboardMetrics,
  RecoveryCase,
  Customer,
  AuditLog,
  AnalyticsData,
  PolicyConfig
} from './types.ts';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE001');

  // Application Data States
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [selectedCaseData, setSelectedCaseData] = useState<{
    case: RecoveryCase;
    customer?: Customer;
    auditLogs: AuditLog[];
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [policies, setPolicies] = useState<PolicyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Status Filter State for Cases (shared across Dashboard & Cases Page)
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('ALL');

  // Fetch initial data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [m, c, a, p, logsRes] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getCases().catch(() => ({ cases: [], total: 0 })),
        api.getAnalytics().catch(() => null),
        api.getPolicies().catch(() => null),
        api.getAuditTrail({ limit: 100 }).catch(() => ({ logs: [] })),
      ]);

      if (m) setMetrics(m);
      if (c && c.cases) setCases(c.cases);
      if (a) setAnalytics(a);
      if (p) setPolicies(p);
      if (logsRes && logsRes.logs) setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single case details when selectedCaseId changes
  const loadCaseDetails = useCallback(async (id: string) => {
    try {
      const data = await api.getCaseDetails(id);
      setSelectedCaseData(data);
    } catch (err) {
      console.error('Error loading case details for', id, err);
      if (id !== 'CASE001') {
        try {
          const fallbackData = await api.getCaseDetails('CASE001');
          setSelectedCaseData(fallbackData);
          setSelectedCaseId('CASE001');
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetails(selectedCaseId);
    }
  }, [selectedCaseId, loadCaseDetails]);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActivePage('case-details');
  };

  const handleLaunchWorkflowFromAnywhere = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActivePage('agent-activity');
  };

  const handleRefreshCase = () => {
    if (selectedCaseId) {
      loadCaseDetails(selectedCaseId);
    }
    loadAllData();
  };

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#09090b] text-[#fafaf9] overflow-hidden antialiased select-auto">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          activeCasesCount={cases.filter((c) => c.status !== 'RECOVERED').length || 17}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Header */}
          <Header
            activePage={activePage}
            onRefresh={loadAllData}
            isLoading={isLoading}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
          />

          {/* Scrollable View Container */}
          <main className="flex-1 overflow-y-auto pb-12">
            {activePage === 'overview' && (
              <OverviewDashboard
                metrics={metrics}
                cases={cases}
                onSelectCase={handleSelectCase}
                onNavigate={setActivePage}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
                onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
                statusFilter={caseStatusFilter}
                onStatusFilterSelect={setCaseStatusFilter}
              />
            )}

            {activePage === 'cases' && (
              <RecoveryCasesPage
                cases={cases}
                onSelectCase={handleSelectCase}
                onNavigate={setActivePage}
                onQuickRunRecovery={handleLaunchWorkflowFromAnywhere}
                initialStatusFilter={caseStatusFilter}
                onStatusFilterChange={setCaseStatusFilter}
              />
            )}

            {activePage === 'case-details' && (
              <CaseDetailsPage
                caseItem={selectedCaseData?.case || cases.find((c) => c.invoiceNumber === selectedCaseId || c.id === selectedCaseId) || cases[0]}
                customer={selectedCaseData?.customer}
                auditLogs={selectedCaseData?.auditLogs || []}
                onBack={() => setActivePage('cases')}
                onNavigate={setActivePage}
                onRefreshCase={handleRefreshCase}
                onLaunchWorkflow={handleLaunchWorkflowFromAnywhere}
              />
            )}

            {activePage === 'agent-activity' && (
              <AgentActivityPage
                cases={cases}
                selectedCaseId={selectedCaseId}
                onSelectCase={(id) => {
                  setSelectedCaseId(id);
                  loadCaseDetails(id);
                }}
                onRefreshAll={loadAllData}
                onNavigate={setActivePage}
              />
            )}

            {activePage === 'audit-trail' && (
              <AuditTrailPage
                logs={auditLogs}
                onSelectCase={handleSelectCase}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsPage analytics={analytics} />
            )}

            {activePage === 'policies' && (
              <PoliciesPage
                policies={policies}
                onRefreshPolicies={loadAllData}
              />
            )}

            {activePage === 'settings' && (
              <SettingsDemoPage
                onResetAll={loadAllData}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
                onSelectCase={handleSelectCase}
                onNavigate={setActivePage}
              />
            )}

            {activePage === 'engineering-notes' && (
              <EngineeringNotesPage />
            )}
          </main>
        </div>

        {/* Global Batch Processing Modal */}
        <BatchProcessingModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={loadAllData}
        />

        {/* Global Demo Scenario Modal */}
        <ScenarioModal
          isOpen={isScenarioModalOpen}
          onClose={() => setIsScenarioModalOpen(false)}
          onSelectCase={setSelectedCaseId}
          onNavigate={setActivePage}
        />
      </div>
    </ToastProvider>
  );
}
