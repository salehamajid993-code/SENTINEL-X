import React from 'react';
import { 
  BrainCircuit, 
  Target, 
  Eye, 
  Wrench, 
  Lightbulb, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { AgentStep, IncidentState } from '../types.ts';

interface AgentDecisionPanelProps {
  state: IncidentState;
}

export const AgentDecisionPanel: React.FC<AgentDecisionPanelProps> = ({ state }) => {
  // Grab the latest step with decision or execution context
  const latestStep: AgentStep | undefined = state.steps[state.steps.length - 1];

  const objective = state.currentObjective || 'Awaiting task initialization.';
  const observation = latestStep?.observation || 'Perimeter monitoring normal. Ready to observe anomalies.';
  const selectedAction = latestStep?.toolName ? `${latestStep.toolName}()` : (state.activeTool ? `${state.activeTool}()` : 'Formulating action strategy...');
  const reason = latestStep?.reason || 'Agent reasoning engine idle. Initialize execution to evaluate observations.';
  const confidence = latestStep?.confidence ?? state.confidence;
  const nextStep = latestStep?.nextStep || 'Awaiting next decision cycle.';

  return (
    <div className="bg-[#111114] border border-[#23232a] rounded p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23232a] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            Agent Decision Panel
          </h2>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          CONFIDENCE: <span className="text-green-500 font-bold">{confidence}%</span>
        </div>
      </div>

      {/* Decision attributes stack */}
      <div className="flex-1 space-y-3 font-mono text-xs overflow-y-auto custom-scrollbar pr-1">
        {/* Current Objective */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3">
          <div className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-1">
            Target Objective
          </div>
          <div className="text-sm font-semibold text-slate-200">
            {objective}
          </div>
        </div>

        {/* Observation [O] */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono font-bold text-xs shrink-0 mt-0.5">
            O
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">
              Observation
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {observation}
            </div>
          </div>
        </div>

        {/* Reasoning [R] */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono font-bold text-xs shrink-0 mt-0.5">
            R
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              Reasoning
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {reason}
            </div>
          </div>
        </div>

        {/* Action [A] */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-mono font-bold text-xs shrink-0 mt-0.5">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-green-400 font-bold uppercase tracking-wider mb-0.5">
              Selected Action
            </div>
            <div className="text-xs text-slate-200 font-semibold flex items-center justify-between flex-wrap gap-1">
              <span className="text-blue-400">{selectedAction}</span>
              {latestStep?.toolInput && Object.keys(latestStep.toolInput).length > 0 && (
                <span className="text-slate-500 text-[10px] font-normal truncate max-w-[180px]">
                  {JSON.stringify(latestStep.toolInput)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Next Step */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-2.5">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
            Next Tactical Step
          </div>
          <div className="text-xs text-slate-400">
            {nextStep}
          </div>
        </div>
      </div>
    </div>
  );
};
