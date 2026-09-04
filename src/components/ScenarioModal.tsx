import React from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';
import { PageId } from './Sidebar.tsx';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: PageId) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelectCase,
  onNavigate,
}) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'scenario-1',
      caseId: 'CASE001',
      title: 'Scenario 1: Successful Recovery',
      badge: 'HIGH ROI',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description:
        'Expired card payment failure → AI diagnoses expired credentials → Sends update link → Customer updates card → Payment verified → ₹12,999 recovered → Workflow automatically stops.',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    {
      id: 'scenario-2',
      caseId: 'CASE002',
      title: 'Scenario 2: Repeated Failure & Escalation',
      badge: 'GUARDRAIL RULE 2',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description:
        'Bank decline occurs across 3 attempts → Guardrail detects threshold 3/3 reached → Automated actions strictly locked → Assigned to Enterprise Relationship Manager.',
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
    },
    {
      id: 'scenario-3',
      caseId: 'CASE003',
      title: 'Scenario 3: Customer Dispute Interception',
      badge: 'GUARDRAIL RULE 3',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description:
        'Dispute flag received via gateway webhook → Guardrail halts all dunning messages and retries immediately → Prevents chargeback penalties → Escalates to dispute ops.',
      icon: ShieldAlert,
      iconColor: 'text-amber-400',
    },
    {
      id: 'scenario-4',
      caseId: 'CASE004',
      title: 'Scenario 4: Already Paid (Idempotency)',
      badge: 'GUARDRAIL RULE 1',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description:
        'Payment status is already SUCCESS → Agent evaluates guardrails → Enforces Policy Rule 1 → No recovery actions dispatched → Prevents double charges.',
      icon: CheckCircle2,
      iconColor: 'text-blue-400',
    },
  ];

  const handleLaunch = async (s: typeof scenarios[0]) => {
    try {
      await api.runScenario(s.id);
      showToast('Scenario Loaded', `Activated: ${s.title}`, 'info');
      onSelectCase(s.caseId);
      onNavigate('agent-activity');
      onClose();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to activate scenario', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#fafaf9]">
                5-Minute Demo Scenarios
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">
                Select any deterministic scenario to observe the autonomous agent workflow
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-[#fafaf9] p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="p-4 bg-[#111114] border border-[#27272a] hover:border-amber-500/50 rounded-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded bg-[#18181b] border border-[#27272a] mt-0.5 shrink-0">
                    <Icon className={`w-4 h-4 ${s.iconColor}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-[#fafaf9]">{s.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                      <span className="text-[10px] text-[#71717a] font-mono">Case: {s.caseId}</span>
                    </div>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{s.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunch(s)}
                  className="shrink-0 w-full sm:w-auto bg-[#18181b] hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-amber-500/40 px-3.5 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Launch Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#111114] border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#71717a]">
          <span>Tip: Each scenario resets the corresponding synthetic case for a reproducible demo.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-medium text-[#a1a1aa] hover:text-[#fafaf9]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
