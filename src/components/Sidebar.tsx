import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Activity,
  ScrollText,
  BarChart3,
  ShieldAlert,
  Sliders,
  Terminal,
  RotateCcw,
  Zap
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'cases'
  | 'case-details'
  | 'agent-activity'
  | 'audit-trail'
  | 'analytics'
  | 'policies'
  | 'settings'
  | 'engineering-notes';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenBatchModal: () => void;
  activeCasesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onOpenBatchModal,
  activeCasesCount = 17,
}) => {
  const navItems = [
    { id: 'overview' as PageId, label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'cases' as PageId, label: 'Recovery Cases', icon: FolderKanban, badge: activeCasesCount },
    { id: 'case-details' as PageId, label: 'Case Details', icon: FileText },
    { id: 'agent-activity' as PageId, label: 'Agent Activity / Live', icon: Activity, pulse: true },
    { id: 'audit-trail' as PageId, label: 'Audit Trail', icon: ScrollText },
    { id: 'analytics' as PageId, label: 'Analytics', icon: BarChart3 },
    { id: 'policies' as PageId, label: 'Policies & Guardrails', icon: ShieldAlert },
    { id: 'settings' as PageId, label: 'Settings & Demo Data', icon: Sliders },
    { id: 'engineering-notes' as PageId, label: 'Engineering Notes', icon: Terminal },
  ];

  return (
    <aside className="w-64 bg-[#111114] border-r border-[#27272a] flex flex-col h-screen shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-stone-950 text-base shadow-sm">
            R
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[#fafaf9] flex items-center gap-1.5">
              REVENUE.AI
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-mono">
                
              </span>
            </div>
            <div className="text-[10px] text-[#a1a1aa] font-medium tracking-wide">
              
            </div>
          </div>
        </div>
      </div>


      {/* Main Nav */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#71717a]">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#27272a]/60 text-[#fafaf9] border-l-2 border-amber-500 pl-2.5 font-semibold shadow-inner'
                  : 'text-[#a1a1aa] hover:text-[#fafaf9] hover:bg-[#18181b]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-[#71717a]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[10px] bg-[#27272a] text-[#fafaf9] px-1.5 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              )}
              {item.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Batch Processing Quick Action */}
      <div className="p-3 border-t border-[#27272a] bg-[#141418]/60 space-y-2">
        <button
          onClick={onOpenBatchModal}
          className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Process Revenue Risk Batch</span>
        </button>

        {/* Live Agent Status Footer */}
        <div className="p-2.5 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <div>
              <div className="text-[11px] font-semibold text-[#fafaf9] leading-none">
                Autonomous Loop
              </div>
              <div className="text-[9px] text-[#a1a1aa] mt-0.5">8 Guardrails Active</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">READY</span>
        </div>
      </div>
    </aside>
  );
};
