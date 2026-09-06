import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  Target, 
  Crosshair, 
  ShieldCheck, 
  Zap, 
  Radio,
  Cpu,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Info,
  ChevronRight
} from 'lucide-react';
import { IncidentState, IncidentStatus, SeverityLevel } from '../types.ts';

interface OverviewPanelProps {
  state: IncidentState;
}

const getStatusBadge = (status: IncidentStatus) => {
  switch (status) {
    case 'IDLE':
      return { label: 'STANDBY', color: 'bg-[#1c1c24] text-slate-400 border-[#23232a]' };
    case 'OBSERVING':
      return { label: 'OBSERVING TELEMETRY', color: 'bg-blue-950/60 text-blue-400 border-blue-500/40 animate-pulse' };
    case 'INVESTIGATING':
      return { label: 'ACTIVE INVESTIGATION', color: 'bg-blue-950/80 text-blue-300 border-blue-500/50 animate-pulse' };
    case 'AWAITING_APPROVAL':
      return { label: 'HUMAN APPROVAL REQUIRED', color: 'bg-amber-950/80 text-amber-300 border-amber-500/80 animate-bounce' };
    case 'MITIGATING':
      return { label: 'EXECUTING MITIGATION', color: 'bg-purple-950/60 text-purple-300 border-purple-500/40 animate-pulse' };
    case 'ADAPTING':
      return { label: 'ADAPTING TO FAILURE', color: 'bg-rose-950/80 text-rose-300 border-rose-500/70 animate-pulse' };
    case 'VERIFYING':
      return { label: 'VERIFYING RECOVERY', color: 'bg-blue-950/60 text-blue-300 border-blue-500/40 animate-pulse' };
    case 'RESOLVED':
      return { label: 'THREAT RESOLVED', color: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/50' };
    case 'FAILED':
      return { label: 'MITIGATION FAILED', color: 'bg-red-950/80 text-red-400 border-red-500/60' };
    default:
      return { label: status, color: 'bg-[#1c1c24] text-slate-400 border-[#23232a]' };
  }
};

const getSeverityBadge = (severity: SeverityLevel) => {
  switch (severity) {
    case 'CRITICAL':
      return { label: 'CRITICAL', color: 'text-red-500 font-bold' };
    case 'HIGH':
      return { label: 'HIGH SEVERITY', color: 'text-amber-500 font-bold' };
    case 'MEDIUM':
      return { label: 'MEDIUM SEVERITY', color: 'text-yellow-500 font-bold' };
    case 'LOW':
      return { label: 'LOW SEVERITY', color: 'text-blue-400 font-bold' };
  }
};

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ state }) => {
  const [showLoopDetails, setShowLoopDetails] = useState(false);
  const statusInfo = getStatusBadge(state.status);
  const severityInfo = getSeverityBadge(state.severity);

  // Compute canonical 6-stage pipeline states:
  // Observe → Decide → Act → Verify → Adapt → Resolve
  const hasObserveCompleted = state.steps.some(s => s.phase === 'OBSERVE' && s.toolStatus === 'SUCCESS');
  const hasDecideCompleted = state.steps.some(s => (s.phase === 'INVESTIGATE' || s.phase === 'DECIDE') && s.toolStatus === 'SUCCESS');
  const hasActAttempted = state.steps.some(s => s.phase === 'ACT' || s.toolName === 'block_ip');
  const hasAdapted = state.adaptations.length > 0 || state.steps.some(s => s.isAdaptation || s.phase === 'ADAPT');
  const hasVerified = state.steps.some(s => s.phase === 'VERIFY' || s.toolName === 'check_server_health');
  const isResolved = state.status === 'RESOLVED';

  // Current active canonical stage
  let activeCanonicalStage = 0; // 0: Observe, 1: Decide, 2: Act, 3: Adapt, 4: Verify, 5: Resolve
  if (isResolved) {
    activeCanonicalStage = 5;
  } else if (state.status === 'VERIFYING' || state.currentPhase === 'VERIFY') {
    activeCanonicalStage = 4;
  } else if (state.status === 'ADAPTING' || state.currentPhase === 'ADAPT' || (hasActAttempted && !hasAdapted && state.adaptations.length > 0)) {
    activeCanonicalStage = 3;
  } else if (state.status === 'MITIGATING' || state.status === 'AWAITING_APPROVAL' || state.currentPhase === 'ACT') {
    activeCanonicalStage = 2;
  } else if (state.status === 'INVESTIGATING' || state.currentPhase === 'INVESTIGATE' || state.currentPhase === 'DECIDE') {
    activeCanonicalStage = 1;
  } else if (state.steps.length > 0) {
    activeCanonicalStage = 0;
  }

  const pipelineStages = [
    {
      id: 'OBSERVE',
      num: '01',
      title: 'OBSERVE',
      subtitle: 'Telemetry Ingress',
      isCompleted: hasObserveCompleted,
      isActive: activeCanonicalStage === 0 && !isResolved,
    },
    {
      id: 'DECIDE',
      num: '02',
      title: 'DECIDE',
      subtitle: 'Adversary Profiling',
      isCompleted: hasDecideCompleted,
      isActive: activeCanonicalStage === 1 && !isResolved,
    },
    {
      id: 'ACT',
      num: '03',
      title: 'ACT',
      subtitle: 'Perimeter Mitigation',
      isCompleted: hasActAttempted,
      isActive: activeCanonicalStage === 2 && !isResolved,
      hasFailure: state.steps.some(s => s.toolName === 'block_ip' && s.toolStatus === 'FAILURE'),
    },
    {
      id: 'ADAPT',
      num: '04',
      title: 'ADAPT',
      subtitle: 'Failure Replan',
      isCompleted: hasAdapted,
      isActive: activeCanonicalStage === 3 && !isResolved,
      highlight: hasAdapted,
    },
    {
      id: 'VERIFY',
      num: '05',
      title: 'VERIFY',
      subtitle: 'Empirical Health Check',
      isCompleted: hasVerified,
      isActive: activeCanonicalStage === 4 && !isResolved,
    },
    {
      id: 'RESOLVE',
      num: '06',
      title: 'RESOLVE',
      subtitle: 'Post-Mortem Dossier',
      isCompleted: isResolved,
      isActive: activeCanonicalStage === 5 || isResolved,
    },
  ];

  // Why Agentic 8-Node Loop state mapping
  const loopNodes = [
    { label: 'Goal', active: true, desc: 'High-level objective received' },
    { label: 'Observation', active: state.steps.length > 0, desc: 'WAF & Ingress logs analyzed' },
    { label: 'Decision', active: state.steps.some(s => s.toolName === 'inspect_ip' || s.toolName === 'scan_endpoint'), desc: 'Investigation & tool formulation' },
    { label: 'Action', active: hasActAttempted, desc: 'Firewall drop attempted' },
    { label: 'Failure', active: state.steps.some(s => s.toolStatus === 'FAILURE'), desc: 'Kernel netfilter lock detected', isFailure: true },
    { label: 'Replan', active: hasAdapted, desc: 'Strategy pivoted to Reverse Proxy', isAdapt: true },
    { label: 'Alternative Action', active: state.steps.some(s => s.toolName === 'apply_rate_limit'), desc: 'L7 Token Bucket Rate Limit applied', isAdapt: true },
    { label: 'Verification', active: hasVerified, desc: 'Empirical health telemetry verified' },
  ];

  return (
    <div className="bg-[#111114] border border-[#23232a] rounded p-4 space-y-4">
      {/* Top metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Incident Status */}
        <div className="bg-[#16161c] border border-[#23232a] p-3 rounded">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono font-bold">
            <span className="flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Status</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">{state.incidentId}</span>
          </div>
          <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Severity */}
        <div className="bg-[#16161c] border border-[#23232a] p-3 rounded">
          <div className="flex items-center space-x-1 text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Severity</span>
          </div>
          <div className={`text-sm font-mono uppercase ${severityInfo.color}`}>
            {severityInfo.label}
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-[#16161c] border border-[#23232a] p-3 rounded">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono font-bold">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confidence</span>
            </span>
            <span className="text-green-500 font-bold font-mono text-sm">{state.confidence}%</span>
          </div>
          <div className="w-full bg-[#23232a] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${state.confidence}%` }}
            />
          </div>
        </div>

        {/* Attack Type */}
        <div className="bg-[#16161c] border border-[#23232a] p-3 rounded">
          <div className="flex items-center space-x-1 text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono font-bold">
            <Target className="w-3.5 h-3.5 text-red-400" />
            <span>Classification</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate">
            {state.attackType.replace('_', ' ')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Layer-7 Ingress Flood</span>
        </div>

        {/* Target Asset */}
        <div className="bg-[#16161c] border border-[#23232a] p-3 rounded col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-1 text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-mono font-bold">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Target Perimeter</span>
          </div>
          <div className="text-xs font-mono text-blue-400 font-semibold truncate">
            {state.evidence.affectedEndpoint}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">svc-auth-core-deployment</span>
        </div>
      </div>

      {/* Visual Canonical Agentic Pipeline: Observe → Decide → Act → Verify → Adapt → Resolve */}
      <div className="pt-2 border-t border-[#23232a]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
              AUTONOMOUS EXECUTION PIPELINE
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Current Phase: <strong className="text-blue-400 uppercase">{state.currentPhase}</strong>
          </span>
        </div>

        {/* 6-Stage Pipeline Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {pipelineStages.map((stage) => {
            let containerStyle = 'bg-[#0d0d10] border-[#23232a]/80 text-slate-500';

            if (stage.isActive) {
              if (stage.id === 'ADAPT' || stage.highlight) {
                containerStyle = 'bg-purple-950/30 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse';
              } else if (stage.id === 'RESOLVE') {
                containerStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
              } else {
                containerStyle = 'bg-blue-950/40 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]';
              }
            } else if (stage.isCompleted) {
              if (stage.hasFailure) {
                containerStyle = 'bg-red-950/20 border-red-500/40 text-red-300';
              } else if (stage.highlight) {
                containerStyle = 'bg-purple-950/20 border-purple-500/40 text-purple-300';
              } else {
                containerStyle = 'bg-[#16161c] border-emerald-500/30 text-slate-300';
              }
            }

            return (
              <div 
                key={stage.id}
                className={`p-2.5 rounded border transition-all relative flex flex-col justify-between min-h-[64px] font-mono ${containerStyle}`}
              >
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-bold tracking-wider">{stage.num}.</span>
                  {stage.isActive ? (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider animate-pulse bg-blue-500/20 text-blue-300 border-blue-500/40">
                      ACTIVE
                    </span>
                  ) : stage.isCompleted ? (
                    stage.hasFailure ? (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider text-red-400 bg-red-950/60 border-red-500/40">
                        FAILED
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider text-green-400 bg-green-950/60 border-green-500/40">
                        DONE
                      </span>
                    )
                  ) : (
                    <span className="text-[8px] text-slate-600">PENDING</span>
                  )}
                </div>

                <div className="text-xs font-bold tracking-wider">
                  {stage.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {stage.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Why Agentic?" Core Decision Loop Ribbon */}
      <div className="pt-2 border-t border-[#23232a]">
        <div className="bg-[#0d0d10] border border-[#23232a] rounded p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <Info className="w-3 h-3 text-blue-400" />
              <span>WHY AGENTIC? CORE DECISION & REPLANNING LOOP:</span>
            </div>
            <button
              onClick={() => setShowLoopDetails(!showLoopDetails)}
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              {showLoopDetails ? 'Hide Details' : 'Explain Loop'}
            </button>
          </div>

          {/* 8-node loop chain */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            {loopNodes.map((node, i) => (
              <React.Fragment key={node.label}>
                <div 
                  className={`px-2 py-1 rounded border transition-all ${
                    node.isFailure && node.active
                      ? 'bg-red-950/60 border-red-500 text-red-300 font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : node.isAdapt && node.active
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : node.active
                      ? 'bg-[#16161c] border-blue-500/40 text-blue-300 font-semibold'
                      : 'bg-[#111114] border-[#23232a] text-slate-600'
                  }`}
                  title={node.desc}
                >
                  {node.label}
                </div>
                {i < loopNodes.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Expanded loop explanation */}
          {showLoopDetails && (
            <div className="mt-2.5 pt-2 border-t border-[#23232a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
              <div className="p-2 rounded bg-[#16161c] border border-[#23232a]">
                <strong className="text-blue-400 block mb-0.5">1. Autonomous Goals</strong>
                Operates from declarative objectives, not scripted step-by-step playbooks.
              </div>
              <div className="p-2 rounded bg-[#16161c] border border-[#23232a]">
                <strong className="text-amber-400 block mb-0.5">2. Tool Synthesis</strong>
                Dynamically chains inspection and mitigation tools via function calling.
              </div>
              <div className="p-2 rounded bg-[#16161c] border border-red-500/30">
                <strong className="text-red-400 block mb-0.5">3. Failure Detection</strong>
                Netfilter kernel lock error triggers autonomous re-evaluation rather than crashing.
              </div>
              <div className="p-2 rounded bg-[#16161c] border border-purple-500/30">
                <strong className="text-purple-400 block mb-0.5">4. Dynamic Adaptation</strong>
                Switches from L3/L4 perimeter drop to L7 token-bucket rate limiting, then verifies health.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Objective Banner */}
      <div className="bg-[#16161c] border border-[#23232a] rounded p-2.5 flex items-start space-x-2.5">
        <div className="p-1 rounded bg-blue-500/10 text-blue-400 mt-0.5 border border-blue-500/20">
          <Crosshair className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
            Target Objective:
          </div>
          <div className="text-xs text-slate-200 font-mono font-medium">
            {state.currentObjective}
          </div>
        </div>
      </div>
    </div>
  );
};
