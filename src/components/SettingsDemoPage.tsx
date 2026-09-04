import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Zap,
  Play,
  CreditCard,
  Sparkles,
  Server,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  FileCode,
  X
} from 'lucide-react';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';
import { PageId } from './Sidebar.tsx';

interface SettingsDemoPageProps {
  onResetAll: () => void;
  onOpenBatchModal: () => void;
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: PageId) => void;
}

export const SettingsDemoPage: React.FC<SettingsDemoPageProps> = ({
  onResetAll,
  onOpenBatchModal,
  onSelectCase,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [simInvoice, setSimInvoice] = useState('INV1001');
  const [simOutcome, setSimOutcome] = useState('SUCCESS');
  const [simResult, setSimResult] = useState<any>(null);

  const handleResetData = async () => {
    setIsResetting(true);
    setShowConfirmModal(false);
    try {
      await api.resetDemo();
      showToast('Demo Dataset Reset', 'Local JSON files restored to original synthetic state.', 'success');
      onResetAll();
    } catch (err: any) {
      showToast('Reset Failed', err.message || 'Error resetting demo', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRunScenario = async (scenarioId: string, caseId: string) => {
    try {
      await api.runScenario(scenarioId);
      showToast('Scenario Loaded', `Loaded scenario ${scenarioId}. Navigating to live execution.`, 'info');
      onSelectCase(caseId);
      onNavigate('agent-activity');
    } catch (err: any) {
      showToast('Error', err.message || 'Scenario failed', 'error');
    }
  };

  const handleTestPaymentSimulation = async () => {
    try {
      const res = await api.simulatePayment(simInvoice, simOutcome);
      setSimResult(res);
      showToast('Gateway Simulator', `Outcome: ${res.result} (${res.gatewayResponseCode})`, 'info');
      onResetAll();
    } catch (err: any) {
      showToast('Simulation Error', err.message || 'Gateway simulation failed', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Settings & Demo Data Storage</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Local JSON demo data management, deterministic scenario test harnesses, and payment gateway simulator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isResetting}
            className="bg-[#18181b] hover:bg-[#27272a] text-[#fafaf9] border border-amber-500/30 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting Data...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Demo Architecture Callout */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-[#fafaf9] flex items-center gap-2">
                <span>File-Based Demo Data Storage (/data/*.json)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  Zero Database Dependency
                </span>
              </h3>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              All synthetic data for this application is stored entirely in local JSON files inside the <code className="text-amber-300 font-mono">/data</code> folder. No SQLite, PostgreSQL, MongoDB, Firebase, or external databases are used.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {[
                { name: 'customers.json', desc: '50+ synthetic customers' },
                { name: 'payments.json', desc: '50+ payment records' },
                { name: 'recovery_cases.json', desc: 'Active & resolved cases' },
                { name: 'recovery_actions.json', desc: 'Action ledger' },
                { name: 'audit_logs.json', desc: 'Immutable audit trail' },
                { name: 'recovery_policies.json', desc: 'Deterministic guardrails' },
              ].map((f) => (
                <div key={f.name} className="p-2 bg-[#111114] border border-[#27272a] rounded-md text-[11px]">
                  <div className="font-mono text-amber-300 font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5 truncate">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 4 Scenarios & Gateway Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 4 Deterministic Scenarios */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div>
              <h3 className="text-sm font-semibold text-[#fafaf9]">
                Interactive Demo Scenarios
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">
                One-click test harnesses for end-to-end evaluation
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              4 Scenarios
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'scenario-1',
                caseId: 'CASE001',
                invoiceId: 'INV1001',
                name: 'Scenario 1: Successful Recovery',
                desc: 'Expired card (INV1001) → AI diagnosis → 1-click update link → Payment verified → ₹12,999 recovered → Auto-stop',
                badge: 'Success Flow',
                badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
              {
                id: 'scenario-2',
                caseId: 'CASE002',
                invoiceId: 'INV1002',
                name: 'Scenario 2: Repeated Failure (Max Attempts)',
                desc: 'Attempts 1 to 3 fail (INV1002) → Policy Rule 2 triggers → Automation locked → Escalate to Human',
                badge: 'Rule 2 Guardrail',
                badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              },
              {
                id: 'scenario-3',
                caseId: 'CASE003',
                invoiceId: 'INV1003',
                name: 'Scenario 3: Customer Dispute Interception',
                desc: 'Dispute detected (INV1003) → Policy Rule 3 halts dunning immediately → Prevents chargeback penalties',
                badge: 'Rule 3 Guardrail',
                badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              },
              {
                id: 'scenario-4',
                caseId: 'CASE004',
                invoiceId: 'INV1004',
                name: 'Scenario 4: Already Paid (Idempotency)',
                desc: 'Payment status already SUCCESS (INV1004) → Policy Rule 1 enforces no-action → Double charges prevented',
                badge: 'Rule 1 Guardrail',
                badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              },
            ].map((s) => (
              <div
                key={s.id}
                className="p-3.5 bg-[#111114] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[#fafaf9]">{s.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] leading-relaxed">{s.desc}</p>
                </div>
                <button
                  onClick={() => handleRunScenario(s.id, s.caseId)}
                  className="bg-[#18181b] hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Run</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Payment Gateway Simulator */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-[#fafaf9]">
                  Payment Gateway Simulator (POST /api/payments/retry)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                REST API
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-[#a1a1aa] leading-relaxed">
                Trigger mock payment retries against the banking switch simulator to test webhook response handling and settlement verification.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-[#fafaf9] mb-1">
                  Target Invoice Number:
                </label>
                <input
                  type="text"
                  value={simInvoice}
                  onChange={(e) => setSimInvoice(e.target.value)}
                  placeholder="e.g., INV1001"
                  className="w-full bg-[#111114] border border-[#27272a] rounded-md px-3 py-2 text-xs text-[#fafaf9] font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#fafaf9] mb-1">
                  Simulated Gateway Outcome:
                </label>
                <select
                  value={simOutcome}
                  onChange={(e) => setSimOutcome(e.target.value)}
                  className="w-full bg-[#111114] border border-[#27272a] rounded-md px-3 py-2 text-xs text-[#fafaf9] font-mono focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value="SUCCESS">SUCCESS (200 - Charge Authorized)</option>
                  <option value="INSUFFICIENT_FUNDS">FAILED (402 - Insufficient Funds)</option>
                  <option value="EXPIRED_CARD">FAILED (402 - Card Expired)</option>
                  <option value="BANK_DECLINE">FAILED (403 - Do Not Honor)</option>
                  <option value="GATEWAY_ERROR">FAILED (504 - Gateway Timeout)</option>
                </select>
              </div>

              <button
                onClick={handleTestPaymentSimulation}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2 rounded-md text-xs transition-colors cursor-pointer"
              >
                Dispatch Test Gateway Request
              </button>

              {simResult && (
                <div className="mt-3 p-3 bg-[#111114] border border-[#27272a] rounded-lg text-xs font-mono space-y-1">
                  <div className="flex justify-between text-[#a1a1aa]">
                    <span>Status:</span>
                    <span className={simResult.result === 'SUCCESS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {simResult.result} ({simResult.gatewayResponseCode})
                    </span>
                  </div>
                  {simResult.authorizationCode && (
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>Auth Code:</span>
                      <span className="text-[#fafaf9]">{simResult.authorizationCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#a1a1aa]">
                    <span>Timestamp:</span>
                    <span className="text-[#71717a]">{new Date(simResult.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#71717a]">
            <span>Latency Simulator: 350ms</span>
            <span>PCI-DSS Mock: Level 1</span>
          </div>
        </div>
      </div>

      {/* Synthetic Dataset Overview & Engine Config */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#fafaf9] flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Dataset: 50 Customers & 50 Payments</span>
          </div>
          <div className="text-[11px] text-[#a1a1aa]">
            Enterprise (₹12,999 - ₹45,000), Pro (₹4,999 - ₹8,999), and Growth (₹2,499 - ₹3,499) tiers across realistic failure taxonomies.
          </div>
        </div>

        <button
          onClick={onOpenBatchModal}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Process Revenue Risk Batch</span>
        </button>
      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#fafaf9]">
                    Reset Demo Data?
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Restore original synthetic JSON dataset
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-[#71717a] hover:text-[#fafaf9] p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg text-xs space-y-2 text-[#a1a1aa]">
              <p>This action will reset the local file-based storage:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#fafaf9]">
                <li>Restore original synthetic records in <code className="text-amber-300 font-mono">/data/</code></li>
                <li>Remove any newly generated recovery actions</li>
                <li>Restore original recovery cases and audit trail</li>
                <li>Recalculate all dashboard KPIs and recovery rates</li>
              </ul>
              <p className="text-[10px] text-emerald-400 pt-1">
                Zero external database dependencies — purely updates local JSON files.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isResetting}
                className="px-3.5 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#fafaf9] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Restoring...' : 'Confirm & Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
