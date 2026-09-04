import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '../types.ts';
import { useToast } from './Toast.tsx';

interface AuditTrailPageProps {
  logs: AuditLog[];
  onSelectCase: (invoiceNumber: string) => void;
}

export const AuditTrailPage: React.FC<AuditTrailPageProps> = ({ logs, onSelectCase }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return logs.filter((log) => {
      if (!log) return false;
      if (operatorFilter !== 'ALL' && log.operator !== operatorFilter) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchCase = (log.caseId || '').toLowerCase().includes(q);
        const matchEvent = (log.event || '').toLowerCase().includes(q);
        const matchResult = (log.result || '').toLowerCase().includes(q);
        const matchPolicy = (log.policyDecision || '').toLowerCase().includes(q);
        if (!matchCase && !matchEvent && !matchResult && !matchPolicy) return false;
      }
      return true;
    });
  }, [logs, searchTerm, operatorFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Case ID', 'Event', 'AI Decision', 'Policy Decision', 'Action', 'Result', 'Operator'];
    const rows = (filteredLogs || []).map((l) => [
      `"${l.timestamp || ''}"`,
      `"${l.caseId || ''}"`,
      `"${l.event || ''}"`,
      `"${(l.aiDecision || '').replace(/"/g, '""')}"`,
      `"${(l.policyDecision || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.result || '').replace(/"/g, '""')}"`,
      `"${l.operator || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revenue_agent_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Successful', `Exported ${filteredLogs.length} audit trail records as CSV`, 'success');
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafaf9] flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Cryptographically timestamped record of every autonomous risk detection, policy check, and settlement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-[#18181b] hover:bg-[#27272a] text-[#fafaf9] border border-[#27272a] px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by Case ID, Event, Policy, Result..."
            className="w-full bg-[#111114] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-xs text-[#fafaf9] placeholder-[#71717a] focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="bg-[#111114] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#fafaf9] focus:outline-hidden focus:border-amber-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Operators</option>
            <option value="AI_AGENT">AI Agent Only</option>
            <option value="HUMAN">Human Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#141418] border-b border-[#27272a] text-[#71717a]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Case ID</th>
                <th className="py-3 px-4 font-semibold">Event</th>
                <th className="py-3 px-4 font-semibold">AI Decision</th>
                <th className="py-3 px-4 font-semibold">Policy Decision</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Result</th>
                <th className="py-3 px-4 font-semibold">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a]">
                    No audit records match the selected query.
                  </td>
                </tr>
              ) : (
                (filteredLogs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-[#111114] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#71717a] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      <button
                        onClick={() => onSelectCase(log.caseId)}
                        className="hover:underline cursor-pointer"
                      >
                        {log.caseId}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#fafaf9] whitespace-nowrap">
                      {log.event}
                    </td>
                    <td className="py-3 px-4 text-[#a1a1aa] max-w-[170px] truncate" title={log.aiDecision}>
                      {log.aiDecision}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                        {log.policyDecision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#fafaf9] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#a1a1aa] max-w-[200px] truncate" title={log.result}>
                      {log.result}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                          log.operator === 'AI_AGENT'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {log.operator}
                      </span>
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
