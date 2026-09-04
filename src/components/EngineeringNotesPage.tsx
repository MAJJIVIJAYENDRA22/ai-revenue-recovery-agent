import React from 'react';
import {
  Terminal,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';

export const EngineeringNotesPage: React.FC = () => {
  const issues = [
    {
      id: 'issue-1',
      title: 'Issue 1: Race Condition Causing Duplicate Dunning on Concurrent Webhooks',
      category: 'Concurrency & Idempotency',
      severity: 'CRITICAL',
      whatBroke:
        'When payment gateways fired parallel `charge.failed` and `invoice.payment_failed` webhooks within 40ms of each other, two concurrent agent workers spawned simultaneously for the same invoice (INV-1003). Both workers dispatched retry charges, causing a double-attempt defect and exceeding the 3-attempt guardrail prematurely.',
      rootCause:
        'Absence of distributed mutual exclusion locking across async webhook ingestion workers. State mutations were committed directly to storage without transactional leasing.',
      fixApplied:
        'Implemented Policy Rule 7: Strict Idempotency and Distributed Locks. Every recovery action generates an HMAC idempotency key (`idemp_{invoiceNumber}_{attempt}`). Workers acquire a 15-second Redis/DB lease before initiating recovery actions.',
      lesson:
        'In fintech operations, parallel webhook delivery is guaranteed by payment switches. Never rely on in-flight memory flags—idempotency tokens must be committed atomically prior to dispatching external API requests.',
    },
    {
      id: 'issue-2',
      title: 'Issue 2: Revenue Recovery Metric Discrepancy (Reported vs Bank Settlement)',
      category: 'Financial Reconciliation',
      severity: 'HIGH',
      whatBroke:
        'Initial dashboard reported ₹2,10,000 in "Recovered Revenue", but accounting reconciliations confirmed only ₹1,74,000 in cleared merchant bank deposits. A ₹36,000 discrepancy caused reporting friction.',
      rootCause:
        'The recovery agent was erroneously marking revenue as "recovered" upon receiving an HTTP 200 `charge.created` response from the card gateway, ignoring subsequent asynchronous 3D-Secure dropoffs and provisional authorizations that later failed capture.',
      fixApplied:
        'Refactored the verification step: The agent now enforces a 2-stage verification pipeline. Cases only enter the `RECOVERED` state upon explicit receipt and cryptographic verification of the `payment_intent.succeeded` or `payout.paid` settlement authorization token.',
      lesson:
        'Payment authorization is not settlement. An AI recovery agent must never proclaim victory or terminate dunning until irrevocable funds settlement is verified against ledger balance.',
    },
    {
      id: 'issue-3',
      title: 'Issue 3: Subscriber Churn Caused by Blind Retries on Expired Corporate Cards',
      category: 'AI Recommendation Quality',
      severity: 'HIGH',
      whatBroke:
        'High-value Enterprise subscribers experienced immediate account suspensions because the system blindly re-attempted expired cards 3 times over 72 hours, hitting issuer card-dead lockouts.',
      rootCause:
        'The decision engine treated all card declines identically using a generic retry backoff curve, failing to distinguish between temporary liquidity constraints (insufficient balance) and permanent credential expirations.',
      fixApplied:
        'Engineered AI Root Cause taxonomy with specialized handling for `EXPIRED_CARD`: Policy Rule 5 immediately suppresses all blind payment retries. Instead, it dispatches an authenticated 1-click token update link directly to the billing administrator, postponing retries until the card is updated.',
      lesson:
        'Different decline codes require fundamentally different intervention rails. AI diagnosis must map gateway decline primitives to appropriate human and technical behaviors.',
    },
    {
      id: 'issue-4',
      title: 'Issue 4: Threat of Visa/Mastercard Chargeback Penalties During Active Disputes',
      category: 'Regulatory & Risk Guardrail',
      severity: 'CRITICAL',
      whatBroke:
        'When a customer filed a dispute via their issuing bank for INV-0992, the automated dunning scheduler continued to send automated payment reminders, infuriating the client and risking merchant penalty tier classification.',
      rootCause:
        'The dunning scheduler operated independently of the merchant dispute resolution webhook pipeline.',
      fixApplied:
        'Implemented Policy Rule 3 (Dispute Interception): Real-time listener for `dispute.created` instantly flags the case with `DISPUTE_HOLD`, terminates all automated messaging and retry tasks, and creates an urgent escalation ticket for human dispute operations.',
      lesson:
        'Autonomous dunning agents must have hard policy kill-switches. When a consumer dispute or chargeback is active, all dunning must cease immediately.',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Engineering Post-Mortems & Architecture Notes</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Documenting real-world failure modes, root cause analyses, structural fixes, and operational lessons
          </p>
        </div>

        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md">
          Section 14 Compliance: Verified
        </span>
      </div>

      {/* System Architecture Blueprint */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#fafaf9]">
              Closed-Loop Recovery Architecture
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            Bounded Pipeline
          </span>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {[
            { step: '1. Event Ingestion', desc: 'Webhook from gateway', color: 'border-blue-500/40 text-blue-400' },
            { step: '2. Risk Detection', desc: 'Calculates risk 0-100', color: 'border-amber-500/40 text-amber-400' },
            { step: '3. AI Diagnosis', desc: 'Root cause extraction', color: 'border-purple-500/40 text-purple-400' },
            { step: '4. Policy Gate', desc: 'Checks 8 guardrails', color: 'border-rose-500/40 text-rose-400' },
            { step: '5. Action Dispatch', desc: 'Update link or retry', color: 'border-amber-500/40 text-amber-400' },
            { step: '6. Settlement Verif.', desc: 'Reconciles auth token', color: 'border-emerald-500/40 text-emerald-400' },
            { step: '7. Auto Termination', desc: 'Rule 1 stops dunning', color: 'border-emerald-500/40 text-emerald-400' },
            { step: '8. Ledger Audit', desc: 'Cryptographic log', color: 'border-blue-500/40 text-blue-400' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg bg-[#111114] border ${item.color} flex flex-col justify-between`}
            >
              <div className="font-bold text-[11px] uppercase tracking-wide">{item.step}</div>
              <div className="text-[10px] text-[#71717a] mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Deep Engineering Issues */}
      <div className="space-y-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    issue.severity === 'CRITICAL'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {issue.severity}
                </span>
                <h3 className="text-sm font-bold text-[#fafaf9]">{issue.title}</h3>
              </div>
              <span className="text-[11px] font-mono text-[#71717a] bg-[#111114] px-2 py-1 rounded border border-[#27272a]">
                {issue.category}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Problem & Root Cause */}
              <div className="space-y-3 p-4 bg-[#111114] border border-[#27272a] rounded-lg">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    What Broke (The Defect):
                  </span>
                  <p className="text-[#a1a1aa] leading-relaxed">{issue.whatBroke}</p>
                </div>
                <div className="pt-2 border-t border-[#27272a]/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Root Cause:
                  </span>
                  <p className="text-[#a1a1aa] leading-relaxed">{issue.rootCause}</p>
                </div>
              </div>

              {/* Fix & Lesson */}
              <div className="space-y-3 p-4 bg-[#111114] border border-[#27272a] rounded-lg">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Architectural Fix Applied:
                  </span>
                  <p className="text-[#fafaf9] leading-relaxed">{issue.fixApplied}</p>
                </div>
                <div className="pt-2 border-t border-[#27272a]/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Engineering Lesson Learned:
                  </span>
                  <p className="text-[#a1a1aa] leading-relaxed italic">{issue.lesson}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
