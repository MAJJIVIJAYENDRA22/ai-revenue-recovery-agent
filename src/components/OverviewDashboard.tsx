import React from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { DashboardMetrics, RecoveryCase } from '../types.ts';
import { PageId } from './Sidebar.tsx';

interface OverviewDashboardProps {
  metrics: DashboardMetrics | null;
  cases: RecoveryCase[];
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: PageId) => void;
  onOpenBatchModal: () => void;
  onOpenScenarioModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  cases,
  onSelectCase,
  onNavigate,
  onOpenBatchModal,
  onOpenScenarioModal,
}) => {
  if (!metrics) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-[#18181b] rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-28 bg-[#18181b] rounded-xl"></div>
          <div className="h-28 bg-[#18181b] rounded-xl"></div>
          <div className="h-28 bg-[#18181b] rounded-xl"></div>
          <div className="h-28 bg-[#18181b] rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Format currency in INR
  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const pieData = [
    { name: 'Recovered', value: metrics.revenueRecovered, color: '#10b981' },
    { name: 'Pending Recovery', value: Math.max(0, metrics.revenueAtRisk - metrics.revenueRecovered - 35000), color: '#f59e0b' },
    { name: 'Escalated / Hold', value: 35000, color: '#ef4444' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9]">
            AI Revenue Recovery
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Detect revenue at risk. Recover it intelligently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenScenarioModal}
            className="bg-[#18181b] hover:bg-[#27272a] text-[#fafaf9] border border-[#27272a] px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>5-Min Demo Scenarios</span>
          </button>
          <button
            onClick={onOpenBatchModal}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-stone-950" />
            <span>Process Revenue Risk Batch</span>
          </button>
        </div>
      </div>

      {/* Demo Environment Disclaimer Banner */}
      <div className="bg-[#18181b] border border-amber-500/25 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
            Demo Environment
          </span>
          <span className="text-[#a1a1aa] text-[11px] leading-snug">
            All customer and payment information shown is synthetic. Sourced dynamically from local JSON files (<span className="font-mono text-amber-300">/data/*.json</span>). No database required.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Zero Database Dependency</span>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Revenue at Risk */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Revenue at Risk
          </div>
          <div className="text-xl font-bold text-[#fafaf9] font-mono mt-1.5">
            {formatINR(metrics.revenueAtRisk)}
          </div>
          <div className="text-[10px] text-amber-400 font-medium mt-1 flex items-center gap-1">
            <span>● In jeopardy</span>
          </div>
        </div>

        {/* KPI 2: Revenue Recovered */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Revenue Recovered
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">
            {formatINR(metrics.revenueRecovered)}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Verified funds</span>
          </div>
        </div>

        {/* KPI 3: Recovery Rate */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Recovery Rate
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1.5">
            {metrics.recoveryRate}%
          </div>
          <div className="text-[10px] text-[#a1a1aa] font-mono mt-1 truncate">
            {metrics.comparisonText}
          </div>
        </div>

        {/* KPI 4: Active Recovery Cases */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Active Cases
          </div>
          <div className="text-xl font-bold text-[#fafaf9] font-mono mt-1.5">
            {metrics.activeRecoveryCases}
          </div>
          <div className="text-[10px] text-blue-400 mt-1">In autonomous loop</div>
        </div>

        {/* KPI 5: Escalated Cases */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Escalated Cases
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono mt-1.5">
            {metrics.escalatedCases}
          </div>
          <div className="text-[10px] text-[#a1a1aa] mt-1">Human intervention</div>
        </div>

        {/* KPI 6: Recovery Attempts */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Recovery Attempts
          </div>
          <div className="text-xl font-bold text-[#fafaf9] font-mono mt-1.5">
            {metrics.recoveryAttempts}
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">Bounded (max 3/case)</div>
        </div>
      </div>

      {/* Comparison Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-500/10 via-[#18181b] to-emerald-500/10 border border-[#27272a] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[#a1a1aa]">Performance Metric:</span>
          <span className="font-semibold text-emerald-400 font-mono">
            {metrics.comparisonText}
          </span>
        </div>
        <div className="text-[11px] text-[#71717a] font-mono">
          Autonomous Loop: Verified settlement stops workflow
        </div>
      </div>

      {/* Chart & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Recovery Portfolio Distribution */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#fafaf9]">
                Revenue Recovery Portfolio
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">
                Comparison of recovered funds vs pending retry & human escalations
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              54.4% Rec. Rate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  stroke="#71717a"
                  fontSize={11}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#a1a1aa"
                  fontSize={11}
                  width={140}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#fafaf9',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(metrics.chartData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-[#27272a] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[#a1a1aa] block text-[10px] uppercase">Recovered</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatINR(metrics.revenueRecovered)}
              </span>
            </div>
            <div>
              <span className="text-[#a1a1aa] block text-[10px] uppercase">In Retry</span>
              <span className="font-bold text-amber-400 font-mono">
                {formatINR(Math.max(0, metrics.revenueAtRisk - metrics.revenueRecovered - 35000))}
              </span>
            </div>
            <div>
              <span className="text-[#a1a1aa] block text-[10px] uppercase">Escalated</span>
              <span className="font-bold text-rose-400 font-mono">
                {formatINR(35000)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Agent Activity */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#fafaf9]">
              Recent Agent Activity
            </h3>
            <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded">
              Live Stream
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[290px]">
            {(metrics.recentActivity || []).map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectCase(act.invoiceNumber)}
                className="p-2.5 rounded-lg bg-[#111114] border border-[#27272a] hover:border-amber-500/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {act.type === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {act.type === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    {act.type === 'info' && (
                      <Zap className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#fafaf9] group-hover:text-amber-300 font-medium leading-tight truncate">
                      {act.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#71717a] font-mono mt-1">
                      <span>{act.invoiceNumber}</span>
                      <span>{act.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('audit-trail')}
            className="w-full mt-4 py-2 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg text-center font-medium transition-colors"
          >
            View Complete Audit Trail →
          </button>
        </div>
      </div>

      {/* Quick Access to Cases Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#fafaf9]">
              High-Risk Recovery Queue
            </h3>
            <p className="text-[11px] text-[#a1a1aa]">
              Priority subscription failure cases requiring or executing recovery
            </p>
          </div>
          <button
            onClick={() => onNavigate('cases')}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All {cases.length} Cases</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272a] text-[#71717a]">
                <th className="py-2.5 px-3 font-medium">Invoice</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-3 font-medium">Amount</th>
                <th className="py-2.5 px-3 font-medium">Failure Reason</th>
                <th className="py-2.5 px-3 font-medium">Risk</th>
                <th className="py-2.5 px-3 font-medium">Attempts</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {(cases || []).slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-[#111114]/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-[#fafaf9]">
                    {c.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-[#fafaf9]">{c.customerName}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#fafaf9]">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-[#a1a1aa] truncate max-w-[160px]">
                    {c.failureReason}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        c.riskLevel === 'HIGH'
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          : c.riskLevel === 'MEDIUM'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                    >
                      {c.riskLevel} ({c.riskScore})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#a1a1aa]">
                    {c.attempts}/{c.maxAttempts}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        c.status === 'RECOVERED'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : c.status === 'RETRY'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : c.status === 'ESCALATED'
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          : 'text-[#a1a1aa] bg-[#27272a]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectCase(c.invoiceNumber)}
                      className="text-amber-400 hover:text-amber-300 font-medium text-xs px-2.5 py-1 rounded bg-[#27272a] hover:bg-amber-500/20 transition-colors"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
