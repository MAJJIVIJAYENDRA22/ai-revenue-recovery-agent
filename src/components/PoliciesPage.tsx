import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  RotateCcw,
  Sliders,
  Info
} from 'lucide-react';
import { PolicyConfig } from '../types.ts';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';

interface PoliciesPageProps {
  policies: PolicyConfig | null;
  onRefreshPolicies: () => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ policies, onRefreshPolicies }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<PolicyConfig | null>(policies);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(policies);
  }, [policies]);

  if (!config) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-[#18181b] rounded w-1/4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-[#18181b] rounded-xl"></div>
          <div className="h-40 bg-[#18181b] rounded-xl"></div>
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof PolicyConfig) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNumberChange = (key: keyof PolicyConfig, value: number) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updatePolicies(config);
      showToast('Policies Saved', 'Deterministic guardrail engine updated with new constraints.', 'success');
      onRefreshPolicies();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save policies', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const rulesList = [
    {
      num: 1,
      name: 'Rule 1: Immediate Success Termination',
      rule: 'If payment succeeds → STOP RECOVERY',
      desc: 'Halts dunning sequences, cancels queued retries, and marks case RECOVERED the instant bank authorization is validated.',
      enabled: config.stopOnPaymentSuccess,
      key: 'stopOnPaymentSuccess' as keyof PolicyConfig,
      critical: true,
    },
    {
      num: 2,
      name: 'Rule 2: Attempt Bound & Escalation',
      rule: 'If attempts >= Max Limit → ESCALATE TO HUMAN',
      desc: 'Prevents infinite dunning loops and harassment. Enforces strict boundary (Default: 3 attempts).',
      enabled: config.escalateOnMaxAttempts,
      key: 'escalateOnMaxAttempts' as keyof PolicyConfig,
      critical: true,
      customParam: (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-[#a1a1aa]">Max Retries per Case:</span>
          <input
            type="number"
            min={1}
            max={5}
            value={config.maxAutomatedAttempts}
            onChange={(e) => handleNumberChange('maxAutomatedAttempts', parseInt(e.target.value) || 3)}
            className="w-16 bg-[#111114] border border-[#27272a] rounded px-2 py-1 text-xs text-amber-400 font-mono text-center focus:outline-hidden focus:border-amber-500"
          />
        </div>
      ),
    },
    {
      num: 3,
      name: 'Rule 3: Customer Dispute Interception',
      rule: 'If customer dispute is detected → STOP AUTOMATION + ESCALATE',
      desc: 'Freezes all automated outreach immediately upon dispute webhook to protect merchant processor rating and prevent chargebacks.',
      enabled: config.stopAndEscalateOnDispute,
      key: 'stopAndEscalateOnDispute' as keyof PolicyConfig,
      critical: true,
    },
    {
      num: 4,
      name: 'Rule 4: Customer Opt-Out Respect',
      rule: 'If customer opted out → STOP AUTOMATION',
      desc: 'Complies with TCPA, GDPR, and CAN-SPAM regulations by suppressing automated notifications for opted-out subscribers.',
      enabled: config.stopOnOptOut,
      key: 'stopOnOptOut' as keyof PolicyConfig,
    },
    {
      num: 5,
      name: 'Rule 5: Expired Credential Isolation',
      rule: 'If payment method is expired → REQUEST PAYMENT METHOD UPDATE',
      desc: 'Suppresses blind card retries (which degrade merchant gateway standing) and dispatches secure 1-click update link instead.',
      enabled: config.requireUpdateForExpiredCard,
      key: 'requireUpdateForExpiredCard' as keyof PolicyConfig,
    },
    {
      num: 6,
      name: 'Rule 6: Intelligent Liquidity Backoff',
      rule: 'If insufficient funds → RETRY LATER',
      desc: 'Applies dynamic exponential backoff (e.g. 24h-48h) to align retries with typical salary and banking clearing windows.',
      enabled: Boolean(config.delayForInsufficientFundsHours),
      key: 'delayForInsufficientFundsHours' as keyof PolicyConfig,
      customParam: (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-[#a1a1aa]">Backoff Window (Hours):</span>
          <input
            type="number"
            min={1}
            max={72}
            value={config.delayForInsufficientFundsHours}
            onChange={(e) => handleNumberChange('delayForInsufficientFundsHours', parseInt(e.target.value) || 24)}
            className="w-16 bg-[#111114] border border-[#27272a] rounded px-2 py-1 text-xs text-amber-400 font-mono text-center focus:outline-hidden focus:border-amber-500"
          />
        </div>
      ),
    },
    {
      num: 7,
      name: 'Rule 7: Idempotent Execution Lock',
      rule: 'Do not execute duplicate recovery actions',
      desc: 'Enforces distributed redis-style idempotency key locking so duplicate webhooks never double-charge or spam a subscriber.',
      enabled: config.blockDuplicateActions,
      key: 'blockDuplicateActions' as keyof PolicyConfig,
      critical: true,
    },
    {
      num: 8,
      name: 'Rule 8: Notification Throttling Guard',
      rule: 'Do not send unlimited recovery messages',
      desc: 'Limits outgoing email / SMS / WhatsApp messages to a maximum rate (Default: max 2 notifications per day).',
      enabled: Boolean(config.maxMessagesPerDay),
      key: 'maxMessagesPerDay' as keyof PolicyConfig,
      customParam: (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-[#a1a1aa]">Max messages per day:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={config.maxMessagesPerDay}
            onChange={(e) => handleNumberChange('maxMessagesPerDay', parseInt(e.target.value) || 2)}
            className="w-16 bg-[#111114] border border-[#27272a] rounded px-2 py-1 text-xs text-amber-400 font-mono text-center focus:outline-hidden focus:border-amber-500"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Recovery Policies & Guardrails</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Bounded autonomous rules governing agent execution. AI decisions must strictly adhere to these 8 deterministic constraints.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-stone-950" />
          <span>{isSaving ? 'Saving...' : 'Save Guardrail Policy'}</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#fafaf9]">
              Policy Engine Status: Active & Enforcing
            </div>
            <div className="text-[11px] text-[#a1a1aa]">
              Every proposed AI intervention is checked through this deterministic rule pipeline prior to execution.
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
          8 of 8 Active
        </span>
      </div>

      {/* Grid of the 8 Core Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rulesList.map((r) => (
          <div
            key={r.num}
            className={`p-5 rounded-xl border transition-all ${
              r.enabled
                ? 'bg-[#18181b] border-[#27272a] hover:border-amber-500/40'
                : 'bg-[#141418] border-[#27272a]/60 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#fafaf9]">{r.name}</span>
                  {r.critical && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono">
                      CRITICAL
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-amber-400 font-semibold">
                  {r.rule}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(r.key)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  r.enabled ? 'bg-amber-500' : 'bg-[#27272a]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-stone-950 absolute top-1 transition-transform ${
                    r.enabled ? 'left-6' : 'left-1'
                  }`}
                ></div>
              </button>
            </div>

            <p className="text-xs text-[#a1a1aa] mt-2.5 leading-relaxed">
              {r.desc}
            </p>

            {r.customParam && r.enabled && (
              <div className="mt-3 pt-3 border-t border-[#27272a]">
                {r.customParam}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
