import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  AlertTriangle,
  OctagonX,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Calendar,
  Layers,
  ScrollText
} from 'lucide-react';
import { RecoveryCase, Customer, AuditLog } from '../types.ts';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';
import { ActionConfirmModal } from './ActionConfirmModal.tsx';
import { PageId } from './Sidebar.tsx';

interface CaseDetailsPageProps {
  caseItem: RecoveryCase | null;
  customer?: Customer;
  auditLogs: AuditLog[];
  onBack: () => void;
  onNavigate: (page: PageId) => void;
  onRefreshCase: () => void;
  onLaunchWorkflow: (caseId: string) => void;
}

export const CaseDetailsPage: React.FC<CaseDetailsPageProps> = ({
  caseItem,
  customer,
  auditLogs,
  onBack,
  onNavigate,
  onRefreshCase,
  onLaunchWorkflow,
}) => {
  const { showToast } = useToast();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [modalAction, setModalAction] = useState<'escalate' | 'stop' | null>(null);

  if (!caseItem) {
    return (
      <div className="p-12 text-center text-[#a1a1aa] space-y-4">
        <p>No recovery case selected.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#fafaf9] rounded-lg text-xs font-semibold cursor-pointer"
        >
          ← Return to Cases
        </button>
      </div>
    );
  }

  const handleRunAIAnalysis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await api.diagnoseWithAI(caseItem.id);
      showToast('AI Diagnosis Updated', `Model: ${res.modelUsed}`, 'success');
      onRefreshCase();
    } catch (err: any) {
      showToast('Error', err.message || 'AI diagnosis failed', 'error');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      await api.retryCase(caseItem.id);
      showToast('Retry Dispatched', 'Payment retry request queued in gateway simulator.', 'info');
      onRefreshCase();
    } catch (err: any) {
      showToast('Action Blocked', err.message || 'Retry cannot be initiated', 'warning');
    }
  };

  const handleConfirmEscalate = async (reason: string) => {
    try {
      await api.escalateCase(caseItem.id, reason);
      showToast('Escalated', 'Case assigned to VIP Support Lead. Automation locked.', 'warning');
      onRefreshCase();
    } catch (err: any) {
      showToast('Error', err.message || 'Escalation failed', 'error');
    }
  };

  const handleConfirmStop = async (reason: string) => {
    try {
      await api.stopCase(caseItem.id, reason);
      showToast('Workflow Stopped', 'Recovery automation stopped. Case marked STOPPED.', 'info');
      onRefreshCase();
    } catch (err: any) {
      showToast('Error', err.message || 'Stop failed', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top breadcrumb & back */}
      <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#fafaf9] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Cases</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#71717a]">Case ID:</span>
          <span className="font-mono text-xs text-amber-400 font-bold">{caseItem.id}</span>
        </div>
      </div>

      {/* Case Hero Overview */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-[#fafaf9]">
                {caseItem.invoiceNumber}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded font-mono uppercase ${
                  caseItem.status === 'RECOVERED'
                    ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                    : caseItem.status === 'RETRY'
                    ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                    : caseItem.status === 'AWAITING_CUSTOMER_ACTION'
                    ? 'text-blue-400 bg-blue-500/15 border border-blue-500/30'
                    : caseItem.status === 'ESCALATED'
                    ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                    : 'text-[#a1a1aa] bg-[#27272a]'
                }`}
              >
                {caseItem.status}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                  caseItem.riskLevel === 'HIGH'
                    ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                    : caseItem.riskLevel === 'MEDIUM'
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                }`}
              >
                RISK: {caseItem.riskLevel} ({caseItem.riskScore}/100)
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#a1a1aa] flex-wrap pt-1">
              <span className="flex items-center gap-1.5 text-[#fafaf9] font-medium">
                <Building className="w-3.5 h-3.5 text-[#71717a]" />
                {caseItem.customerName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#71717a]" />
                {caseItem.customerEmail}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#71717a]" />
                {caseItem.daysOverdue} days overdue
              </span>
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#27272a]">
            <div className="lg:text-right">
              <div className="text-[11px] text-[#a1a1aa] uppercase tracking-wider">
                Invoice Amount
              </div>
              <div className="text-2xl font-bold text-[#fafaf9] font-mono">
                ₹{caseItem.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                Recovered: ₹{caseItem.amountRecovered.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {caseItem.status !== 'RECOVERED' && caseItem.status !== 'ESCALATED' ? (
                <button
                  onClick={() => onLaunchWorkflow(caseItem.invoiceNumber)}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-stone-950" />
                  <span>Run Recovery</span>
                </button>
              ) : caseItem.status === 'RECOVERED' ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Revenue Recovered — Workflow Stopped</span>
                </div>
              ) : (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Human Escalation Required</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 pt-4 border-t border-[#27272a] flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRetryPayment}
              disabled={caseItem.status === 'RECOVERED' || caseItem.attempts >= caseItem.maxAttempts}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-[#fafaf9] px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Retry Payment</span>
            </button>

            <button
              onClick={() => setModalAction('escalate')}
              disabled={caseItem.status === 'ESCALATED'}
              className="bg-[#27272a] hover:bg-rose-900/30 text-[#fafaf9] hover:text-rose-300 border border-transparent hover:border-rose-500/30 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Escalate</span>
            </button>

            <button
              onClick={() => setModalAction('stop')}
              disabled={caseItem.status === 'STOPPED'}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafaf9] px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <OctagonX className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Stop Recovery</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate('audit-trail')}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>View Audit Log</span>
          </button>
        </div>
      </div>

      {/* Grid: AI Diagnosis + Recovery Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: AI Diagnosis */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#fafaf9]">
                  AI Diagnosis
                </h2>
              </div>
              <button
                onClick={handleRunAIAnalysis}
                disabled={isDiagnosing}
                className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1 font-mono cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Analyzing...' : 'Re-run Gemini AI'}</span>
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-[#a1a1aa] block text-[11px] uppercase tracking-wider">
                  Root Cause
                </span>
                <span className="text-sm font-semibold text-[#fafaf9] mt-0.5 block">
                  {caseItem.aiDiagnosis.rootCause}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <span className="text-[#71717a] block text-[10px] uppercase">Confidence</span>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                    {Math.round(caseItem.aiDiagnosis.confidence * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <span className="text-[#71717a] block text-[10px] uppercase">Model Used</span>
                  <span className="text-xs font-semibold text-amber-400 font-mono mt-0.5 block truncate">
                    {caseItem.aiDiagnosis.modelUsed || 'gemini-2.5-flash'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#a1a1aa] block text-[11px] uppercase tracking-wider">
                  AI Recommendation
                </span>
                <span className="text-xs font-semibold text-amber-300 mt-0.5 block bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  {caseItem.recommendedAction === 'REQUEST_PAYMENT_UPDATE'
                    ? 'Request payment method update and retry payment after successful update.'
                    : caseItem.recommendedAction === 'SMART_RETRY'
                    ? 'Delay next attempt by 24h to align with optimal account liquidity cycle.'
                    : caseItem.recommendedAction === 'HUMAN_ESCALATION'
                    ? 'Maximum attempts reached. Escalate to Relationship Manager.'
                    : 'Halt automated operations to prevent chargebacks.'}
                </span>
              </div>

              <div>
                <span className="text-[#a1a1aa] block text-[11px] uppercase tracking-wider">
                  Reasoning
                </span>
                <p className="text-[#a1a1aa] italic bg-[#111114] p-3 rounded-lg border border-[#27272a] leading-relaxed mt-1">
                  "{caseItem.aiDiagnosis.reasoning}"
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#71717a] font-mono border-t border-[#27272a] pt-3">
            Diagnosis evaluated against 8 policy guardrails
          </div>
        </div>

        {/* Card 2: Recovery Plan */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#27272a]">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#fafaf9]">
                Bounded Recovery Plan
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { step: 1, title: 'Request payment method update', desc: 'Deliver 1-click update portal to customer verified channels.' },
                { step: 2, title: 'Wait for payment method update', desc: 'Listen to webhook callbacks from issuing payment switch.' },
                { step: 3, title: 'Retry payment', desc: 'Perform zero-auth test followed by transaction settlement charge.' },
                { step: 4, title: 'Verify payment', desc: 'Reconcile gateway settlement response code and authorization hash.' },
                { step: 5, title: 'Stop workflow if payment succeeds', desc: 'Policy Rule 1: Instant termination upon confirmed recovery.' },
                { step: 6, title: 'Escalate if maximum attempts are reached', desc: 'Policy Rule 2: Lock automation at attempt 3/3 and page operator.' },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-3 p-2.5 bg-[#111114] border border-[#27272a] rounded-lg text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="font-semibold text-[#fafaf9]">{s.title}</div>
                    <div className="text-[11px] text-[#71717a] mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-300/90 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>AI cannot deviate outside these predefined policy bounds.</span>
          </div>
        </div>
      </div>

      {/* Grid: Recovery Status & Case Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Status */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafaf9] pb-2 border-b border-[#27272a]">
            Recovery Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
              <div className="text-[#71717a] text-[10px] uppercase">Attempt Count</div>
              <div className="text-lg font-bold font-mono text-[#fafaf9] mt-0.5">
                Attempt {caseItem.attempts} of {caseItem.maxAttempts}
              </div>
              <div className="w-full bg-[#27272a] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(caseItem.attempts / caseItem.maxAttempts) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
              <div className="text-[#71717a] text-[10px] uppercase">Current Status</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5 uppercase">
                {caseItem.status.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase">Recovered</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  ₹{caseItem.amountRecovered.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                <div className="text-[#71717a] text-[10px] uppercase">Potential</div>
                <div className="text-base font-bold font-mono text-[#fafaf9] mt-0.5">
                  ₹{caseItem.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail for this Case */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafaf9]">
                Case Audit Trail
              </h3>
              <span className="text-[10px] text-[#71717a] font-mono">Immutable</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(!auditLogs || auditLogs.length === 0) ? (
                <div className="p-4 text-center text-xs text-[#71717a]">
                  No audit events recorded for this case yet.
                </div>
              ) : (
                (auditLogs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-[#111114] border border-[#27272a] rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#fafaf9]">{log.event}</span>
                      <span className="text-[10px] font-mono text-[#71717a]">{log.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#a1a1aa]">{log.result}</div>
                    <div className="flex items-center gap-3 text-[10px] text-[#71717a] font-mono pt-0.5">
                      <span>Operator: {log.operator}</span>
                      <span>Policy: {log.policyDecision}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ActionConfirmModal
        isOpen={modalAction === 'escalate'}
        onClose={() => setModalAction(null)}
        onConfirm={handleConfirmEscalate}
        title="Confirm Human Escalation"
        description={`This will halt autonomous retries on ${caseItem.invoiceNumber} and assign the case to the Human Account Specialist team.`}
        confirmLabel="Confirm Escalation"
      />

      <ActionConfirmModal
        isOpen={modalAction === 'stop'}
        onClose={() => setModalAction(null)}
        onConfirm={handleConfirmStop}
        title="Stop Recovery Workflow"
        description={`This will permanently terminate automated recovery actions on ${caseItem.invoiceNumber}.`}
        confirmLabel="Stop Workflow"
        isDestructive={true}
      />
    </div>
  );
};
