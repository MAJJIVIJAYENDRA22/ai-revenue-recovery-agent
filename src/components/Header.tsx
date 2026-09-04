import React from 'react';
import { PageId } from './Sidebar.tsx';
import { RefreshCw, Zap, Play, Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activePage: PageId;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenBatchModal: () => void;
  onOpenScenarioModal: () => void;
  onSearchFocus?: () => void;
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Detect revenue at risk. Recover it intelligently.'
  },
  cases: {
    title: 'Recovery Cases',
    subtitle: 'Active and resolved subscription payment interventions'
  },
  'case-details': {
    title: 'Case Investigation & Diagnosis',
    subtitle: 'Deep forensic breakdown of payment failure and AI action plan'
  },
  'agent-activity': {
    title: 'Agent Live Execution',
    subtitle: 'Real-time autonomous recovery workflow execution engine'
  },
  'audit-trail': {
    title: 'Audit Trail',
    subtitle: 'Immutable record of AI decisions, policy guardrails, and settlements'
  },
  analytics: {
    title: 'Recovery Analytics',
    subtitle: 'Portfolio recovery performance, success rates, and intervention ROI'
  },
  policies: {
    title: 'Recovery Policies & Guardrails',
    subtitle: 'Deterministic constraints governing autonomous recovery actions'
  },
  settings: {
    title: 'Settings & Synthetic Scenarios',
    subtitle: 'Payment gateway simulation, test benchmarks, and dataset controls'
  },
  'engineering-notes': {
    title: 'Engineering Notes ("What Broke")',
    subtitle: 'Real-world failure modes, edge cases diagnosed, and architectural solutions'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onRefresh,
  isLoading,
  onOpenBatchModal,
  onOpenScenarioModal,
}) => {
  const current = PAGE_TITLES[activePage] || { title: 'AI Revenue Recovery', subtitle: '' };

  return (
    <header className="h-16 bg-[#111114] border-b border-[#27272a] px-6 flex items-center justify-between shrink-0 select-none">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
          <span>Revenue Operations</span>
          <span>/</span>
          <span className="text-[#fafaf9] font-medium">{current.title}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Scenario Quick Launcher */}
        <button
          onClick={onOpenScenarioModal}
          className="bg-[#18181b] hover:bg-[#27272a] text-[#fafaf9] border border-[#27272a] px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Scenarios</span>
        </button>

        {/* Process Batch Button */}
        <button
          onClick={onOpenBatchModal}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Process Batch</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Data"
          className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafaf9] border border-[#27272a] rounded-md transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Live Agent Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded-md text-[11px] text-[#a1a1aa]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Policies Active:</span>
          <span className="text-emerald-400 font-mono font-medium">8 Enforced</span>
        </div>

        {/* Demo Environment Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-md text-[11px] text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span className="font-medium">Demo Environment</span>
          <span className="text-[#71717a] text-[10px]">(Synthetic)</span>
        </div>
      </div>
    </header>
  );
};
