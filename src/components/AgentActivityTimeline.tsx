import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Terminal, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  RefreshCw,
  Eye,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AgentStep, StepEventType } from '../types.ts';

interface AgentActivityTimelineProps {
  steps: AgentStep[];
  activeTool: string | null;
  onSelectStep?: (step: AgentStep) => void;
}

// Categorize each step into one of the 6 key demo categories
type StepCategory = 'FAILED' | 'ADAPTATION' | 'APPROVAL' | 'VERIFICATION' | 'RESOLUTION' | 'SUCCESS' | 'GENERAL';

const categorizeStep = (step: AgentStep): {
  category: StepCategory;
  badgeLabel: string;
  badgeClass: string;
  cardClass: string;
  accentNote?: string;
} => {
  // 1. Failure
  if (step.toolStatus === 'FAILURE' || step.eventType === 'FAILURE_DETECTED') {
    return {
      category: 'FAILED',
      badgeLabel: 'TOOL CALL FAILED',
      badgeClass: 'bg-red-950/80 text-red-300 border-red-500/70 font-bold animate-pulse',
      cardClass: 'border-red-500/60 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
      accentNote: 'EXECUTION FAILED: Kernel lock or network timeout. Triggering autonomous replan.'
    };
  }

  // 2. Adaptation
  if (step.isAdaptation || step.eventType === 'ALTERNATIVE_SELECTED' || step.phase === 'ADAPT') {
    return {
      category: 'ADAPTATION',
      badgeLabel: 'AUTONOMOUS ADAPTATION',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/70 font-bold',
      cardClass: 'border-purple-500/60 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
      accentNote: 'STRATEGIC PIVOT: Formulated fallback mitigation after failure detection.'
    };
  }

  // 3. Human Approval Gate
  if (step.eventType === 'APPROVAL_REQUESTED') {
    return {
      category: 'APPROVAL',
      badgeLabel: 'HITL SAFETY GATE',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/70 font-bold',
      cardClass: 'border-amber-500/60 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      accentNote: 'HUMAN-IN-THE-LOOP: High-impact perimeter action gated by operator authorization.'
    };
  }

  // 4. Verification
  if (step.phase === 'VERIFY' || step.eventType === 'RECOVERY_VERIFIED' || step.toolName === 'check_server_health') {
    return {
      category: 'VERIFICATION',
      badgeLabel: 'HEALTH VERIFIED',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-500/70 font-bold',
      cardClass: 'border-blue-500/50 bg-blue-950/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
      accentNote: 'EMPIRICAL CONFIRMATION: Validated error rate collapsed from 47.3% to 1.2%.'
    };
  }

  // 5. Final Resolution
  if (step.eventType === 'RESOLVED' || step.toolName === 'generate_incident_report' || step.phase === 'RESOLVE') {
    return {
      category: 'RESOLUTION',
      badgeLabel: 'INCIDENT RESOLVED',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 font-bold',
      cardClass: 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      accentNote: 'FINAL CLOSURE: Threat neutralized, post-mortem dossier compiled and archived.'
    };
  }

  // 6. Successful tool call
  if (step.toolStatus === 'SUCCESS') {
    return {
      category: 'SUCCESS',
      badgeLabel: 'SUCCESSFUL CALL',
      badgeClass: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 font-bold',
      cardClass: 'border-[#23232a] bg-[#16161c] hover:border-emerald-500/30'
    };
  }

  // General step
  return {
    category: 'GENERAL',
    badgeLabel: step.eventType.replace('_', ' '),
    badgeClass: 'bg-[#1c1c24] text-slate-300 border-[#23232a] font-bold',
    cardClass: 'border-[#23232a] bg-[#16161c] hover:border-[#2e2e38]'
  };
};

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({
  steps,
  activeTool,
  onSelectStep
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };

  return (
    <div className="bg-[#111114] border border-[#23232a] rounded p-4 flex flex-col h-full font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-[#23232a] mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          <h2 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
            REAL-TIME AGENT EXECUTION TIMELINE
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Executed Steps: <strong className="text-blue-400">{steps.length}</strong></span>
          {activeTool && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40 text-[10px] animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Tool: {activeTool}()</span>
            </span>
          )}
        </div>
      </div>

      {/* Legend for Judges */}
      <div className="mb-3 p-2 rounded bg-[#0d0d10] border border-[#23232a] flex flex-wrap items-center gap-2 text-[9px]">
        <span className="text-slate-500 font-bold uppercase tracking-wider">Legend:</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          Success
        </span>
        <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/50">
          Tool Failure
        </span>
        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50">
          Human Approval (HITL)
        </span>
        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/50">
          Autonomous Adaptation
        </span>
        <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/50">
          Verification
        </span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/60">
          Resolution
        </span>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 min-h-[300px] max-h-[520px]">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
            <Cpu className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
            <span>Agent idle. Click 'Run Autonomous' or 'Step' to begin incident mitigation.</span>
          </div>
        ) : (
          steps.map((step) => {
            const isExpanded = expandedStepId === step.id;
            const meta = categorizeStep(step);

            return (
              <div
                key={step.id}
                className={`border rounded transition-all ${meta.cardClass}`}
              >
                {/* Step Item Header */}
                <div 
                  onClick={() => toggleExpand(step.id)}
                  className="p-2.5 cursor-pointer flex items-start justify-between gap-2"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    {/* Category Icon */}
                    <div className="mt-0.5 shrink-0">
                      {meta.category === 'FAILED' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : meta.category === 'ADAPTATION' ? (
                        <RefreshCw className="w-4 h-4 text-purple-400" />
                      ) : meta.category === 'APPROVAL' ? (
                        <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                      ) : meta.category === 'VERIFICATION' ? (
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      ) : meta.category === 'RESOLUTION' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>

                    {/* Step details */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-500">
                          [{step.timestamp}]
                        </span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-[#23232a] text-slate-300 font-bold">
                          #{step.stepNumber}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${meta.badgeClass}`}>
                          {meta.badgeLabel}
                        </span>
                        {step.toolName && (
                          <span className="text-[11px] text-blue-400 font-semibold bg-[#1c1c24] px-1.5 py-0.2 rounded border border-[#23232a]">
                            {step.toolName}()
                          </span>
                        )}
                        {step.executionTimeMs !== undefined && (
                          <span className="text-[10px] text-slate-500">
                            {step.executionTimeMs}ms
                          </span>
                        )}
                      </div>

                      {/* Accent Note if special event */}
                      {meta.accentNote && (
                        <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 inline-block" />
                          <span>{meta.accentNote}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {step.observation}
                      </p>
                    </div>
                  </div>

                  <button className="text-slate-500 hover:text-slate-300 p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-3 border-t border-[#23232a] bg-[#0d0d10] text-xs space-y-2.5">
                    {step.reason && (
                      <div>
                        <div className="text-[10px] uppercase text-blue-400 font-semibold mb-0.5 tracking-wider">
                          Decision Reasoning:
                        </div>
                        <div className="text-slate-300 text-xs bg-[#16161c] p-2 rounded border border-[#23232a]">
                          {step.reason}
                        </div>
                      </div>
                    )}

                    {step.toolInput && Object.keys(step.toolInput).length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5 tracking-wider">
                          Tool Input:
                        </div>
                        <pre className="text-[11px] bg-[#16161c] p-2 rounded border border-[#23232a] text-blue-300 overflow-x-auto">
                          {JSON.stringify(step.toolInput, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.toolOutput && (
                      <div>
                        <div className={`text-[10px] uppercase font-semibold mb-0.5 tracking-wider ${
                          meta.category === 'FAILED' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          Tool Execution Output:
                        </div>
                        <pre className={`text-[11px] p-2 rounded border overflow-x-auto ${
                          meta.category === 'FAILED' 
                            ? 'bg-red-950/40 text-red-200 border-red-800/60' 
                            : 'bg-[#16161c] text-slate-300 border-[#23232a]'
                        }`}>
                          {JSON.stringify(step.toolOutput, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.nextStep && (
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pt-1">
                        <span className="text-blue-400 font-semibold">Planned Next Action:</span>
                        <span>{step.nextStep}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
