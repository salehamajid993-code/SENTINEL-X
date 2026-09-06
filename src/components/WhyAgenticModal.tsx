import React from 'react';
import { 
  X, 
  BrainCircuit, 
  Target, 
  Shuffle, 
  Layers, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface WhyAgenticModalProps {
  onClose: () => void;
}

export const WhyAgenticModal: React.FC<WhyAgenticModalProps> = ({ onClose }) => {
  const agenticLoop = [
    {
      step: '1. Goal',
      label: 'Goal',
      color: 'border-blue-500/60 bg-blue-950/40 text-blue-300',
      description: 'Declarative high-level objective: "Investigate volumetric anomaly and contain threat." No hardcoded sequential scripts.'
    },
    {
      step: '2. Observation',
      label: 'Observation',
      color: 'border-blue-500/60 bg-blue-950/40 text-blue-300',
      description: 'Queries telemetry logs; detects 540 req/s credential flood originating from 198.51.100.42 targeting /api/v1/auth/login.'
    },
    {
      step: '3. Decision',
      label: 'Decision',
      color: 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300',
      description: 'Selects inspection tools dynamically via Gemini function calling. Formulates mitigation hypothesis for perimeter drop.'
    },
    {
      step: '4. Action',
      label: 'Action',
      color: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
      description: 'Executes perimeter firewall rule block_ip() with Human-in-the-Loop operator safety verification.'
    },
    {
      step: '5. Failure',
      label: 'Failure',
      color: 'border-red-500/70 bg-red-950/50 text-red-300',
      description: 'Firewall driver rejects block due to kernel netfilter synchronization lock. Static scripts crash here; SENTINEL-X isolates the fault.'
    },
    {
      step: '6. Replan',
      label: 'Replan',
      color: 'border-purple-500/70 bg-purple-950/50 text-purple-300',
      description: 'Autonomous reasoning engine analyzes failure and pivots strategy from network Layer-3/4 drop to application Layer-7 rate limiting.'
    },
    {
      step: '7. Alternative Action',
      label: 'Alternative Action',
      color: 'border-purple-500/70 bg-purple-950/50 text-purple-300',
      description: 'Executes apply_rate_limit() on the reverse proxy. Chokes malicious traffic without needing kernel locks.'
    },
    {
      step: '8. Verification',
      label: 'Verification',
      color: 'border-emerald-500/70 bg-emerald-950/50 text-emerald-300',
      description: 'Queries empirical health metrics: Error rate drops 47.3% → 1.2%, latency normalizes to 42ms. Threat definitively resolved.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111114] border border-[#23232a] rounded max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="p-4 border-b border-[#23232a] flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                WHY AGENTIC? ARCHITECTURAL BREAKDOWN
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Closed-Loop Decision Making & Resilience Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#1c1c24] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs text-slate-300">
          {/* Executive Summary */}
          <div className="p-3.5 rounded bg-[#16161c] border border-blue-500/30 text-xs leading-relaxed text-slate-200">
            <strong className="text-blue-400 block mb-1">Autonomous Agent vs. Procedural Script:</strong>
            Traditional security playbooks execute static, fragile if/else routines that fail when an API call times out or a firewall driver locks. <strong>SENTINEL-X</strong> is an autonomous goal-directed decision loop capable of real-time failure detection, replanning, and empirical recovery verification.
          </div>

          {/* Canonical Sequence Pipeline */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>THE AGENTIC LIFECYCLE PIPELINE:</span>
            </div>

            {/* Visual pill loop */}
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded bg-[#0d0d10] border border-[#23232a] mb-3 text-[10px]">
              {agenticLoop.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <span className={`px-2 py-1 rounded border font-bold ${item.color}`}>
                    {item.label}
                  </span>
                  {idx < agenticLoop.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Detailed 8-step breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agenticLoop.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded border ${item.color} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{item.step}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Card */}
          <div className="p-3.5 rounded bg-[#16161c] border border-[#23232a] space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              WHAT DISTINGUISHES THIS SYSTEM:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[#0d0d10] border border-[#23232a]">
                <strong className="text-amber-400 block mb-0.5">Zero Hardcoded Scripts</strong>
                All tool parameters and next steps are formulated dynamically by the decision engine.
              </div>
              <div className="p-2 rounded bg-[#0d0d10] border border-[#23232a]">
                <strong className="text-purple-400 block mb-0.5">Real Failure Recovery</strong>
                Simulates real-world production driver locks and proves graceful autonomous replanning.
              </div>
              <div className="p-2 rounded bg-[#0d0d10] border border-[#23232a]">
                <strong className="text-emerald-400 block mb-0.5">Human-in-the-Loop</strong>
                Preserves strict operator safety oversight for high-risk destructive actions.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#23232a] bg-[#16161c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
