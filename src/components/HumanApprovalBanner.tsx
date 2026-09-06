import React from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  AlertTriangle, 
  Lock, 
  ArrowRight,
  Code2
} from 'lucide-react';
import { PendingApproval } from '../types.ts';

interface HumanApprovalBannerProps {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}

export const HumanApprovalBanner: React.FC<HumanApprovalBannerProps> = ({
  approval,
  onApprove,
  onReject
}) => {
  return (
    <div className="bg-[#16161c] border border-amber-500/60 rounded p-4 shadow-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 mt-0.5 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                APPROVAL REQUIRED (HITL)
              </span>
              <span className="text-xs font-mono text-amber-300 font-semibold">
                High-Risk Operation
              </span>
            </div>
            <h3 className="text-sm font-bold font-mono text-slate-100 mt-1">
              Operation: <span className="text-blue-400">{approval.toolName}()</span>
            </h3>
            <p className="text-xs font-mono text-slate-300 mt-1 leading-relaxed max-w-3xl">
              {approval.description}
            </p>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              <span className="text-amber-400/90 font-semibold">Agent Justification:</span> {approval.reason}
            </div>
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
          <button
            onClick={onReject}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#1c1c24] hover:bg-red-950/40 text-red-400 border border-[#23232a] hover:border-red-500/50 text-xs font-mono font-bold transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject Action</span>
          </button>
          <button
            onClick={onApprove}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(59,130,246,0.35)]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Authorize & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
