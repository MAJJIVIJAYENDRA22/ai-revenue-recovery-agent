import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isDestructive = false,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-[#fafaf9]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-[#fafaf9] p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-[#a1a1aa]">
          <p className="leading-relaxed">{description}</p>
          <div>
            <label className="block text-[11px] font-medium text-[#fafaf9] mb-1.5">
              Reason / Operational Note (will be recorded in Audit Trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Escalated per VIP account guidelines"
              className="w-full bg-[#111114] border border-[#27272a] rounded-md px-3 py-2 text-xs text-[#fafaf9] focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        <div className="p-4 bg-[#111114] border-t border-[#27272a] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#a1a1aa] hover:text-[#fafaf9] hover:bg-[#27272a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(reason || 'Manual override recorded');
              onClose();
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-sm'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
