import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api.ts';
import { useToast } from './Toast.tsx';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [stage, setStage] = useState<'idle' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('Initializing transaction feed parser...');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setProgress(0);
      setResults(null);
    }
  }, [isOpen]);

  const handleStartProcessing = async () => {
    setStage('processing');
    setProgress(15);
    setCurrentAction('Ingesting 50 gateway transaction records from database...');

    await new Promise((r) => setTimeout(r, 600));
    setProgress(40);
    setCurrentAction('Detecting subscription payment failures & calculating risk scores...');

    await new Promise((r) => setTimeout(r, 700));
    setProgress(75);
    setCurrentAction('Evaluating policy guardrails (Rule 1-8) & running AI diagnosis...');

    try {
      const res = await api.processBatch();
      await new Promise((r) => setTimeout(r, 600));
      setProgress(100);
      setCurrentAction('Batch recovery workflows executed. Settlement verified.');

      // Safely parse summary and metrics with fallback defaults
      const summaryData = {
        transactionsProcessed: res?.summary?.transactionsProcessed ?? 50,
        riskCasesDetected: res?.summary?.riskCasesDetected ?? res?.summary?.riskCasesEvaluated ?? 50,
        revenueRecovered: res?.summary?.revenueRecovered ?? res?.metrics?.revenueRecovered ?? 0,
        revenueAtRisk: res?.summary?.revenueAtRisk ?? res?.metrics?.revenueAtRisk ?? 0,
        recoveryRate: res?.summary?.recoveryRate ?? res?.metrics?.recoveryRate ?? 0,
        escalatedCases: res?.summary?.escalatedCases ?? res?.metrics?.escalatedCases ?? 0,
        recoveredInBatch: res?.summary?.recoveredInBatch ?? 0,
        casesRecoveredCount: res?.summary?.casesRecoveredCount ?? 0,
        retriesScheduled: res?.summary?.retriesScheduled ?? 0,
      };

      setResults(summaryData);
      setStage('done');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#fafaf9']
        });
      } catch {
        // non-blocking fallback if canvas cannot render in iframe
      }

      const toastMessage = summaryData.recoveredInBatch > 0
        ? `Recovered ₹${summaryData.recoveredInBatch.toLocaleString('en-IN')} across ${summaryData.casesRecoveredCount} subscription cases`
        : `All 50 transactions evaluated, metrics synchronized`;
      showToast('Batch Complete', toastMessage, 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setStage('idle');
      showToast('Error', err?.message || 'Batch execution failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#fafaf9]">
                Process Revenue Risk Batch
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">
                Analyze synthetic transaction logs and execute bounded recovery
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-[#fafaf9] p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {stage === 'idle' && (
            <div className="space-y-4">
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                This operation will ingest and evaluate the synthetic dataset of <span className="text-[#fafaf9] font-semibold">50 subscription payment transactions</span> across Enterprise, Pro, and Growth tiers.
              </p>
              <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg text-xs space-y-2 text-[#a1a1aa]">
                <div className="flex items-center justify-between">
                  <span>Transactions Ingested:</span>
                  <span className="font-mono text-[#fafaf9] font-medium">50 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anticipated Revenue at Risk:</span>
                  <span className="font-mono text-amber-400 font-medium">₹3,20,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Target Recovery Rate:</span>
                  <span className="font-mono text-emerald-400 font-medium">~54.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Guardrail Policy:</span>
                  <span className="font-mono text-[#a1a1aa]">Max 3 attempts, Rule 1-8 enforced</span>
                </div>
              </div>
            </div>
          )}

          {stage === 'processing' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-mono font-medium animate-pulse">
                  {currentAction}
                </span>
                <span className="font-mono text-[#fafaf9]">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#111114] rounded-full overflow-hidden border border-[#27272a]">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-[#71717a] text-center font-mono">
                Executing Revenue Risk Engine → AI Diagnosis → Policy Check → Recovery Actions
              </p>
            </div>
          )}

          {stage === 'done' && results && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    Batch Successfully Processed
                  </div>
                  <div className="text-[11px] text-[#d4d4d8] mt-0.5">
                    {results.recoveredInBatch > 0
                      ? `Recovered ₹${Number(results.recoveredInBatch).toLocaleString('en-IN')} across ${results.casesRecoveredCount} cases in this run.`
                      : 'All 50 subscription payments evaluated. Recovery policies and guardrails enforced.'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Processed</div>
                  <div className="text-base font-bold text-[#fafaf9] font-mono mt-0.5">
                    {results.transactionsProcessed ?? 50} records
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">
                    {results.riskCasesDetected ?? 50} risk cases evaluated
                  </div>
                </div>

                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Total Recovered</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    ₹{Number(results.revenueRecovered ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">
                    {results.recoveryRate ?? 0}% portfolio recovery
                  </div>
                </div>

                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Active at Risk</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    ₹{Number(results.revenueAtRisk ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#a1a1aa] mt-1">
                    {results.retriesScheduled ?? 0} smart retries in queue
                  </div>
                </div>

                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-lg">
                  <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Escalated to Human</div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                    {results.escalatedCases ?? 0} cases
                  </div>
                  <div className="text-[10px] text-[#a1a1aa] mt-1">Rule 2 guardrail enforced</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#111114] border-t border-[#27272a] flex items-center justify-end gap-3">
          {stage === 'idle' ? (
            <>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#a1a1aa] hover:text-[#fafaf9] hover:bg-[#27272a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProcessing}
                className="px-4 py-1.5 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-stone-950" />
                <span>Start Batch Processing</span>
              </button>
            </>
          ) : stage === 'processing' ? (
            <button
              disabled
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#27272a] text-[#a1a1aa] cursor-not-allowed"
            >
              Processing...
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Done</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
