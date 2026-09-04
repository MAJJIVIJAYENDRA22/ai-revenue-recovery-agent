import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecoveryCase, WorkflowExecutionStep, WorkflowExecutionResult } from '../types.ts';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';
import { PageId } from './Sidebar.tsx';

interface AgentActivityPageProps {
  cases: RecoveryCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onRefreshAll: () => void;
  onNavigate: (page: PageId) => void;
}

export const AgentActivityPage: React.FC<AgentActivityPageProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onRefreshAll,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const currentCase = cases.find((c) => c.invoiceNumber === selectedCaseId || c.id === selectedCaseId) || cases[0];

  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [steps, setSteps] = useState<WorkflowExecutionStep[]>([]);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [simulatedOutcome, setSimulatedOutcome] = useState<'AUTO' | 'SUCCESS' | 'FAILED' | 'ESCALATE'>('AUTO');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[SYS_INIT] Autonomous Revenue Agent Daemon initialized.`,
    `[POLICY_LOAD] 8 Active Guardrails verified and active.`,
    `[GATEWAY_HOOK] Listening for billing decline webhooks...`,
  ]);

  const addConsoleLog = (text: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setConsoleLogs((prev) => [`[${time}] ${text}`, ...prev.slice(0, 30)]);
  };

  // Default workflow steps skeleton for preview
  const defaultSteps: { title: string; desc: string }[] = [
    { title: 'DETECTING REVENUE RISK', desc: 'Ingest webhook payload & compute risk score' },
    { title: 'ANALYZING ROOT CAUSE', desc: 'Diagnose card expiration, balance, or gateway latency' },
    { title: 'SELECTING INTERVENTION', desc: 'Choose optimal recovery rail (1-click link vs smart retry)' },
    { title: 'CHECKING POLICY GUARDRAILS', desc: 'Evaluate 8 active constraints (Rule 1 to 8)' },
    { title: 'EXECUTING RECOVERY ACTION', desc: 'Dispatch customer update portal or multi-rail retry' },
    { title: 'VERIFYING PAYMENT', desc: 'Reconcile settlement authorization code with processor' },
    { title: 'RECOVERY COMPLETE & AUTO-STOP', desc: 'Rule 1: Close case immediately upon verified settlement' },
  ];

  const handleRunWorkflow = async () => {
    if (!currentCase) return;

    setIsRunning(true);
    setActiveStepIndex(0);
    setExecutionResult(null);
    setSteps([]);

    addConsoleLog(`WORKFLOW_START: Initiating recovery pipeline for ${currentCase.invoiceNumber} (₹${currentCase.amount})`);

    try {
      const outcome = simulatedOutcome === 'AUTO' ? undefined : simulatedOutcome;
      const result = await api.executeRecovery(currentCase.id, outcome);

      // Play through animated step sequence
      const returnedSteps = result.steps;
      for (let i = 0; i < returnedSteps.length; i++) {
        setActiveStepIndex(i);
        setSteps((prev) => [...prev, returnedSteps[i]]);
        addConsoleLog(`STEP_${i + 1}: ${returnedSteps[i].title} → ${returnedSteps[i].detail}`);
        await new Promise((r) => setTimeout(r, 650));
      }

      setExecutionResult(result);
      setIsRunning(false);
      onRefreshAll();

      if (result.success) {
        addConsoleLog(`VERIFIED_RECOVERY: ₹${result.recoveredAmount} collected. Rule 1 enforced: Workflow stopped.`);
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#ffffff']
        });
        showToast('Revenue Recovered!', `₹${result.recoveredAmount.toLocaleString('en-IN')} recovered on ${result.invoiceNumber}`, 'success');
      } else if (result.newStatus === 'ESCALATED') {
        addConsoleLog(`POLICY_RULE_2_ENFORCED: Max attempts reached. Case escalated to Human.`);
        showToast('Escalated', 'Max attempts reached. Assigned to Support Lead.', 'warning');
      } else {
        addConsoleLog(`STATUS_UPDATE: Case scheduled for smart retry.`);
        showToast('Retry Queued', result.outcomeMessage, 'info');
      }
    } catch (err: any) {
      setIsRunning(false);
      addConsoleLog(`ERROR: Recovery execution failure - ${err.message}`);
      showToast('Execution Error', err.message || 'Workflow failed', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9] flex items-center gap-2">
            <span>Agent Live Execution Engine</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Real-time closed-loop recovery: Detect → Diagnose → Decide → Act → Verify → Stop
          </p>
        </div>

        {/* Case Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#71717a] font-medium">Select Case:</span>
            <select
              value={currentCase?.invoiceNumber || ''}
              onChange={(e) => onSelectCase(e.target.value)}
              disabled={isRunning}
              className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#fafaf9] font-mono focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {(cases || []).map((c) => (
                <option key={c.id} value={c.invoiceNumber}>
                  {c.invoiceNumber} - {c.customerName} (₹{c.amount.toLocaleString('en-IN')}) - {c.status}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <select
            value={simulatedOutcome}
            onChange={(e: any) => setSimulatedOutcome(e.target.value)}
            disabled={isRunning}
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-hidden cursor-pointer"
          >
            <option value="AUTO">Simulate: Auto/Realistic</option>
            <option value="SUCCESS">Force: Success (Recover)</option>
            <option value="ESCALATE">Force: Escalate (Attempt 3/3)</option>
            <option value="FAILED">Force: Retry Failure</option>
          </select>
        </div>
      </div>

      {/* Target Case Banner */}
      {currentCase && (
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
              INV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#fafaf9]">
                  {currentCase.invoiceNumber}
                </span>
                <span className="text-xs text-[#a1a1aa]">• {currentCase.customerName}</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ₹{currentCase.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xs text-[#71717a] mt-0.5">
                Failure Reason: <span className="text-[#a1a1aa]">{currentCase.failureReason}</span> | Attempts: {currentCase.attempts}/{currentCase.maxAttempts} | Risk: {currentCase.riskLevel} ({currentCase.riskScore}/100)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCase(currentCase.invoiceNumber)}
              className="text-xs text-[#a1a1aa] hover:text-[#fafaf9] px-3 py-2 bg-[#27272a] rounded-lg transition-colors cursor-pointer"
            >
              Case Details
            </button>
            <button
              onClick={handleRunWorkflow}
              disabled={isRunning || currentCase.status === 'RECOVERED'}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-4 h-4 text-stone-950 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Executing...' : 'Run Recovery Workflow'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Execution Split: Stepper on Left, Console on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Workflow Stepper (7 Cols) */}
        <div className="lg:col-span-7 bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
            <div>
              <h3 className="text-sm font-semibold text-[#fafaf9]">
                Live Recovery Workflow Pipeline
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">
                Animated visual execution reflecting verified backend state transitions
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Autonomous
            </span>
          </div>

          {/* Stepper Steps */}
          <div className="space-y-6 relative pl-2">
            {(steps.length > 0 ? steps : defaultSteps.map((d, i) => ({
              id: `step-${i}`,
              title: d.title,
              status: 'pending' as const,
              detail: d.desc,
              durationMs: 0,
              timestamp: '--:--'
            }))).map((step, idx) => {
              const isDone = step.status === 'completed';
              const isCurrent = isRunning && activeStepIndex === idx;
              const isFailed = step.status === 'failed';

              return (
                <div key={step.id || idx} className="flex items-start gap-4 relative">
                  {/* Vertical connector line */}
                  {idx < 6 && (
                    <div
                      className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-6 transition-colors ${
                        isDone ? 'bg-emerald-500/60' : 'bg-[#27272a]'
                      }`}
                    ></div>
                  )}

                  {/* Step Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-stone-950 shadow-[0_0_10px_#10b981]'
                        : isCurrent
                        ? 'bg-amber-500 text-stone-950 shadow-[0_0_12px_#f59e0b] animate-pulse'
                        : isFailed
                        ? 'bg-rose-500 text-stone-950 shadow-[0_0_10px_#ef4444]'
                        : 'bg-[#111114] border border-[#27272a] text-[#71717a]'
                    }`}
                  >
                    {isDone ? '✓' : isCurrent ? '↻' : isFailed ? '✕' : idx + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                          isDone
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-amber-400'
                            : isFailed
                            ? 'text-rose-400'
                            : 'text-[#a1a1aa]'
                        }`}
                      >
                        {step.title}
                      </h4>
                      {step.timestamp && step.timestamp !== '--:--' && (
                        <span className="text-[10px] font-mono text-[#71717a]">
                          {step.timestamp} ({step.durationMs}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success Banner if Recovered */}
          {executionResult?.success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Revenue Recovered
                  </div>
                  <div className="text-xl font-bold font-mono text-[#fafaf9]">
                    ₹{executionResult.recoveredAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    Recovery workflow automatically stopped per Policy Rule 1.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('overview')}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Dashboard →
              </button>
            </div>
          )}

          {/* Escalated Banner if Failed */}
          {executionResult && !executionResult.success && executionResult.newStatus === 'ESCALATED' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Human Escalation Required
                  </div>
                  <div className="text-sm font-semibold text-[#fafaf9]">
                    Maximum automated attempts reached (3/3)
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    Automated workflows locked. Relationship Manager alerted.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('case-details')}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-stone-950 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Inspect →
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Agent Operations Log (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111114] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-3">
              <div className="flex items-center gap-2 text-xs text-[#fafaf9]">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Autonomous Event Bus</span>
              </div>
              <span className="text-[10px] text-emerald-400">STREAMING</span>
            </div>

            <div className="space-y-2 text-[11px] max-h-[420px] overflow-y-auto pr-1">
              {(consoleLogs || []).map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border leading-relaxed ${
                    log.includes('VERIFIED_RECOVERY') || log.includes('COMPLETE')
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : log.includes('ERROR') || log.includes('ESCALATED')
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : log.includes('STEP')
                      ? 'bg-[#18181b] border-[#27272a] text-[#fafaf9]'
                      : 'bg-[#18181b]/50 border-transparent text-[#71717a]'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272a] text-[10px] text-[#71717a] flex items-center justify-between">
            <span>Daemon: recovery-agent-v2</span>
            <span>Gateway: stripe_mock_prod</span>
          </div>
        </div>
      </div>
    </div>
  );
};
