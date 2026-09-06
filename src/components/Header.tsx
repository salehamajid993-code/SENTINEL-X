import React from 'react';
import { 
  ShieldAlert, 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Sparkles, 
  Info, 
  Server, 
  CheckCircle2, 
  Lock
} from 'lucide-react';
import { IncidentState } from '../types.ts';

interface HeaderProps {
  state: IncidentState;
  onStart: (goal: string, mode: 'DEMO' | 'CUSTOM') => void;
  onStep: () => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleSupervised: (supervised: boolean) => void;
  onOpenWhyAgentic: () => void;
  onOpenReport: () => void;
  customGoal: string;
  setCustomGoal: (goal: string) => void;
  mode: 'DEMO' | 'CUSTOM';
  setMode: (mode: 'DEMO' | 'CUSTOM') => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onStart,
  onStep,
  onRun,
  onStop,
  onReset,
  onToggleSupervised,
  onOpenWhyAgentic,
  onOpenReport,
  customGoal,
  setCustomGoal,
  mode,
  setMode,
}) => {
  const isRunning = state.isRunning;
  const isResolved = state.status === 'RESOLVED';
  const hasPendingApproval = Boolean(state.pendingApproval);

  return (
    <header className="border-b border-[#23232a] bg-[#0d0d10] sticky top-0 z-30 px-4 lg:px-6 py-3">
      {/* Top row: Brand & Status Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="text-xl font-bold tracking-tighter text-white font-mono">
              SENTINEL<span className="text-blue-500">-X</span>
            </div>
            <div className="h-4 w-[1px] bg-[#23232a] hidden sm:block"></div>
            <div className="text-[11px] text-slate-400 uppercase tracking-widest hidden sm:block font-mono">
              Autonomous AI Incident Commander
            </div>
          </div>
        </div>

        {/* System telemetry badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Agent Status Pulse Indicator */}
          <div className="flex items-center px-2.5 py-1 bg-[#16161c] border border-[#23232a] rounded">
            <span className={isRunning ? 'status-pulse' : isResolved ? 'status-pulse' : 'status-pulse-amber'}></span>
            <span className="text-xs uppercase font-semibold text-slate-300 font-mono tracking-wider">
              {isRunning ? 'AGENT ACTIVE' : isResolved ? 'RESOLVED' : 'STANDBY'}
            </span>
          </div>

          {/* Session ID */}
          <div className="text-xs text-slate-500 font-mono hidden md:block">
            INCIDENT: <span className="text-slate-300 font-semibold">{state.incidentId}</span>
          </div>

          {/* Engine indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#16161c] border border-[#23232a] text-xs font-mono text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-500">Engine:</span>
            <span className="text-blue-400 font-medium">
              {state.usingGeminiApi ? 'Gemini 3.8 Flash' : 'Gemini Core'}
            </span>
          </div>

          {/* Supervised vs Autonomous Mode toggle */}
          <button
            onClick={() => onToggleSupervised(!state.supervisedMode)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
              state.supervisedMode
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
            }`}
            title="Supervised mode prompts for human confirmation on high-risk operations (e.g. firewall blocking)"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="text-slate-400">Safety:</span>
            <span className="font-semibold">
              {state.supervisedMode ? 'HITL Supervised' : 'Full Autonomous'}
            </span>
          </button>

          {/* Why this is Agentic? button */}
          <button
            onClick={onOpenWhyAgentic}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#16161c] hover:bg-[#1c1c24] border border-[#23232a] hover:border-blue-500/40 text-blue-400 text-xs font-mono transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Why Agentic?</span>
          </button>

          {/* Final report button */}
          {state.report && (
            <button
              onClick={onOpenReport}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Mode Selection, Goal Input & Autonomous Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-2 border-t border-[#23232a]">
        {/* Scenario / Mode selector */}
        <div className="flex items-center space-x-1 bg-[#16161c] p-1 rounded border border-[#23232a] shrink-0">
          <button
            onClick={() => {
              setMode('DEMO');
              onStart('Investigate active volumetric auth flood and adaptively contain threat.', 'DEMO');
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all font-semibold ${
              mode === 'DEMO'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Demo Incident (Failure & Adapt)
          </button>
          <button
            onClick={() => setMode('CUSTOM')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all font-semibold ${
              mode === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Custom Goal
          </button>
        </div>

        {/* Goal input / display */}
        <div className="flex-1 min-w-[200px]">
          {mode === 'CUSTOM' ? (
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Enter incident response goal (e.g., Investigate anomalous auth traffic and contain attacker)..."
              className="w-full bg-[#16161c] border border-[#23232a] rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          ) : (
            <div className="bg-[#16161c] border border-[#23232a] rounded px-3 py-1.5 text-xs text-slate-300 font-mono truncate flex items-center justify-between">
              <span className="truncate">
                <strong className="text-blue-400 font-normal">Active Objective:</strong> {state.goal}
              </span>
              <span className="text-[10px] text-amber-400/90 ml-2 shrink-0">
                [Controlled Failure & Adaptation]
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {mode === 'CUSTOM' && (
            <button
              onClick={() => onStart(customGoal, 'CUSTOM')}
              disabled={isRunning || !customGoal.trim()}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-semibold"
            >
              Set Goal
            </button>
          )}

          {/* Autonomous Run button */}
          {!isRunning ? (
            <button
              onClick={onRun}
              disabled={isResolved || hasPendingApproval}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-mono font-semibold shadow-sm transition-colors"
              title="Run autonomous investigation and mitigation loop until resolved"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Autonomous</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-semibold shadow-sm transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Loop</span>
            </button>
          )}

          {/* Step Button */}
          <button
            onClick={onStep}
            disabled={isRunning || isResolved || hasPendingApproval}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#1c1c24] hover:bg-[#23232a] disabled:opacity-40 text-slate-200 text-xs font-mono font-semibold border border-[#23232a] transition-colors"
            title="Execute exactly one decision cycle"
          >
            <StepForward className="w-3.5 h-3.5 text-blue-400" />
            <span>Step</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#16161c] hover:bg-[#1c1c24] text-slate-400 hover:text-slate-200 text-xs font-mono border border-[#23232a] transition-colors"
            title="Reset incident simulation and evidence"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
