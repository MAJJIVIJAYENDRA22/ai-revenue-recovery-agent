import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Play,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { RecoveryCase } from '../types.ts';
import { PageId } from './Sidebar.tsx';

interface RecoveryCasesPageProps {
  cases: RecoveryCase[];
  onSelectCase: (caseId: string) => void;
  onNavigate: (page: PageId) => void;
  onQuickRunRecovery: (caseId: string) => void;
  initialStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export const RecoveryCasesPage: React.FC<RecoveryCasesPageProps> = ({
  cases,
  onSelectCase,
  onNavigate,
  onQuickRunRecovery,
  initialStatusFilter = 'ALL',
  onStatusFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [failureFilter, setFailureFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'amount' | 'riskScore' | 'attempts' | 'daysOverdue'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const handleUpdateStatusFilter = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (onStatusFilterChange) {
      onStatusFilterChange(newStatus);
    }
  };

  const filteredCases = useMemo(() => {
    if (!cases || !Array.isArray(cases)) return [];
    return cases
      .filter((c) => {
        if (!c) return false;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'RETRY') {
            if (c.status !== 'RETRY' && c.status !== 'AWAITING_CUSTOMER_ACTION' && c.status !== 'IN_PROGRESS') return false;
          } else if (c.status !== statusFilter) {
            return false;
          }
        }
        if (riskFilter !== 'ALL' && (c.riskLevel || c.risk_level) !== riskFilter) return false;
        if (failureFilter !== 'ALL') {
          const reason = (c.failureReason || c.root_cause || '').toLowerCase();
          if (failureFilter === 'expired' && !reason.includes('expired')) return false;
          if (failureFilter === 'insufficient' && !reason.includes('insufficient') && !reason.includes('balance')) return false;
          if (failureFilter === 'bank' && !reason.includes('bank') && !reason.includes('decline')) return false;
          if (failureFilter === 'gateway' && !reason.includes('gateway') && !reason.includes('network') && !reason.includes('timeout')) return false;
          if (failureFilter === 'dispute' && !reason.includes('dispute')) return false;
        }
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchInv = (c.invoiceNumber || c.invoice_id || '').toLowerCase().includes(q);
          const matchCust = (c.customerName || '').toLowerCase().includes(q);
          const matchEmail = (c.customerEmail || '').toLowerCase().includes(q);
          const matchReason = (c.failureReason || c.root_cause || '').toLowerCase().includes(q);
          if (!matchInv && !matchCust && !matchEmail && !matchReason) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = (a as any)?.[sortBy] ?? '';
        const valB = (b as any)?.[sortBy] ?? '';
        if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
        if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
  }, [cases, statusFilter, riskFilter, failureFilter, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9]">
            Recovery Cases
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Showing {filteredCases.length} of {cases.length} total monitored subscription invoices
          </p>
        </div>

        {/* Status Count Mini-Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => handleUpdateStatusFilter(statusFilter === 'RECOVERED' ? 'ALL' : 'RECOVERED')}
            className={`px-2.5 py-1 rounded-md font-mono transition-colors border cursor-pointer ${
              statusFilter === 'RECOVERED'
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-xs'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
            title={statusFilter === 'RECOVERED' ? 'Click to clear filter' : 'Filter by Recovered'}
          >
            Recovered: {cases.filter((c) => c.status === 'RECOVERED').length}
          </button>
          <button
            onClick={() => handleUpdateStatusFilter(statusFilter === 'RETRY' ? 'ALL' : 'RETRY')}
            className={`px-2.5 py-1 rounded-md font-mono transition-colors border cursor-pointer ${
              statusFilter === 'RETRY'
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}
            title={statusFilter === 'RETRY' ? 'Click to clear filter' : 'Filter by In Retry'}
          >
            Retrying: {cases.filter((c) => c.status === 'RETRY' || c.status === 'AWAITING_CUSTOMER_ACTION' || c.status === 'IN_PROGRESS').length}
          </button>
          <button
            onClick={() => handleUpdateStatusFilter(statusFilter === 'ESCALATED' ? 'ALL' : 'ESCALATED')}
            className={`px-2.5 py-1 rounded-md font-mono transition-colors border cursor-pointer ${
              statusFilter === 'ESCALATED'
                ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-xs'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
            }`}
            title={statusFilter === 'ESCALATED' ? 'Click to clear filter' : 'Filter by Escalated'}
          >
            Escalated: {cases.filter((c) => c.status === 'ESCALATED').length}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice, customer, email..."
              className="w-full bg-[#111114] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-xs text-[#fafaf9] placeholder-[#71717a] focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleUpdateStatusFilter(e.target.value)}
              className="w-full bg-[#111114] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafaf9] focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECOVERED">Recovered (Success)</option>
              <option value="RETRY">Retry Queued</option>
              <option value="AWAITING_CUSTOMER_ACTION">Awaiting Customer Action</option>
              <option value="ESCALATED">Escalated to Human</option>
              <option value="STOPPED">Stopped (Dispute / Opt-Out)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-[#111114] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafaf9] focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk (Score 80-100)</option>
              <option value="MEDIUM">Medium Risk (Score 60-79)</option>
              <option value="LOW">Low Risk (Score &lt; 60)</option>
            </select>
          </div>

          {/* Failure Reason Filter */}
          <div>
            <select
              value={failureFilter}
              onChange={(e) => setFailureFilter(e.target.value)}
              className="w-full bg-[#111114] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafaf9] focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Failure Reasons</option>
              <option value="expired">Expired Card</option>
              <option value="insufficient">Insufficient Funds</option>
              <option value="bank">Bank Decline</option>
              <option value="gateway">Gateway Error</option>
              <option value="dispute">Customer Dispute</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#141418] border-b border-[#27272a] text-[#71717a] select-none">
                <th className="py-3 px-4 font-semibold">Invoice</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#fafaf9]"
                >
                  <div className="flex items-center gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Failure Reason</th>
                <th
                  onClick={() => toggleSort('riskScore')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#fafaf9]"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Risk Level</th>
                <th
                  onClick={() => toggleSort('attempts')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-[#fafaf9]"
                >
                  <div className="flex items-center gap-1">
                    <span>Attempts</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Recommended Action</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#71717a]">
                    No recovery cases matched the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#111114] transition-colors group cursor-pointer"
                    onClick={() => onSelectCase(c.invoiceNumber)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#fafaf9] group-hover:text-amber-400 transition-colors">
                      {c.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#fafaf9]">{c.customerName}</div>
                      <div className="text-[10px] text-[#71717a] truncate max-w-[150px]">
                        {c.customerEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#fafaf9]">
                      ₹{c.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[#a1a1aa] max-w-[180px] truncate">
                      {c.failureReason}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={
                          c.riskScore >= 80
                            ? 'text-rose-400'
                            : c.riskScore >= 60
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {c.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          c.riskLevel === 'HIGH'
                            ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            : c.riskLevel === 'MEDIUM'
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                            : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        }`}
                      >
                        ● {c.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#a1a1aa]">
                      <span className={c.attempts >= c.maxAttempts ? 'text-rose-400 font-bold' : ''}>
                        {c.attempts}/{c.maxAttempts}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded">
                        {c.recommendedAction === 'REQUEST_PAYMENT_UPDATE'
                          ? 'Update Payment Method'
                          : c.recommendedAction === 'SMART_RETRY'
                          ? 'Smart Retry'
                          : c.recommendedAction === 'HUMAN_ESCALATION'
                          ? 'Human Escalation'
                          : c.recommendedAction === 'DISPUTE_HOLD'
                          ? 'Dispute Hold'
                          : 'Grace Period'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          c.status === 'RECOVERED'
                            ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                            : c.status === 'RETRY'
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                            : c.status === 'AWAITING_CUSTOMER_ACTION'
                            ? 'text-blue-400 bg-blue-500/15 border border-blue-500/30'
                            : c.status === 'ESCALATED'
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                            : 'text-[#71717a] bg-[#27272a]'
                        }`}
                      >
                        {c.status === 'AWAITING_CUSTOMER_ACTION' ? 'Awaiting Update' : c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {c.status !== 'RECOVERED' && c.status !== 'ESCALATED' && (
                          <button
                            onClick={() => onQuickRunRecovery(c.invoiceNumber)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Execute Agent Recovery Workflow"
                          >
                            <Play className="w-3 h-3" />
                            <span>Run</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectCase(c.invoiceNumber)}
                          className="bg-[#27272a] hover:bg-[#3f3f46] text-[#fafaf9] px-2.5 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
