import React, { useState, useEffect, useCallback } from 'react';
import { IncidentState } from './types.ts';
import { Header } from './components/Header.tsx';
import { OverviewPanel } from './components/OverviewPanel.tsx';
import { AgentActivityTimeline } from './components/AgentActivityTimeline.tsx';
import { AgentDecisionPanel } from './components/AgentDecisionPanel.tsx';
import { ToolExecutionPanel } from './components/ToolExecutionPanel.tsx';
import { IncidentEvidencePanel } from './components/IncidentEvidencePanel.tsx';
import { AdaptationPanel } from './components/AdaptationPanel.tsx';
import { HumanApprovalBanner } from './components/HumanApprovalBanner.tsx';
import { FinalIncidentReportModal } from './components/FinalIncidentReportModal.tsx';
import { WhyAgenticModal } from './components/WhyAgenticModal.tsx';

export default function App() {
  const [state, setState] = useState<IncidentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [customGoal, setCustomGoal] = useState('Investigate anomalous ingress spikes and contain threat.');
  const [mode, setMode] = useState<'DEMO' | 'CUSTOM'>('DEMO');
  const [isWhyAgenticOpen, setIsWhyAgenticOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Fetch initial state and connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const fetchState = async () => {
      try {
        const res = await fetch('/api/agent/state');
        if (res.ok) {
          const data: IncidentState = await res.json();
          setState(data);
        }
      } catch (err) {
        console.error('Failed to fetch initial state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchState();

    // Connect to Server-Sent Events stream for real-time reactivity
    try {
      eventSource = new EventSource('/api/agent/stream');
      eventSource.onmessage = (event) => {
        try {
          const updatedState: IncidentState = JSON.parse(event.data);
          setState(updatedState);
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (err) {
      console.warn('Could not initialize SSE:', err);
    }

    // Gentle polling fallback every 3s to guarantee synchronized telemetry state
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/agent/state');
        if (res.ok) {
          const data: IncidentState = await res.json();
          setState(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(data)) {
              return data;
            }
            return prev;
          });
        }
      } catch {
        // Silently ignore transient network blips
      }
    }, 2500);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Action handlers
  const handleStart = async (goal: string, selectedMode: 'DEMO' | 'CUSTOM') => {
    try {
      const res = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, mode: selectedMode, supervised: state?.supervisedMode ?? true })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to start incident:', err);
    }
  };

  const handleStep = async () => {
    try {
      const res = await fetch('/api/agent/step', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to step agent:', err);
    }
  };

  const handleRun = async () => {
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to run agent:', err);
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch('/api/agent/stop', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to stop agent:', err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/agent/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to reset agent:', err);
    }
  };

  const handleToggleSupervised = async (supervised: boolean) => {
    try {
      const res = await fetch('/api/agent/supervised', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervised })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to toggle supervised mode:', err);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to approve action:', err);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to reject action:', err);
    }
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-slate-300 font-mono">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Initializing SENTINEL-X Incident Mesh...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* App Header */}
      <Header
        state={state}
        onStart={handleStart}
        onStep={handleStep}
        onRun={handleRun}
        onStop={handleStop}
        onReset={handleReset}
        onToggleSupervised={handleToggleSupervised}
        onOpenWhyAgentic={() => setIsWhyAgenticOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        customGoal={customGoal}
        setCustomGoal={setCustomGoal}
        mode={mode}
        setMode={setMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* Human In The Loop Safety Layer Alert */}
        {state.pendingApproval && (
          <HumanApprovalBanner
            approval={state.pendingApproval}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {/* Section 1: Overview */}
        <OverviewPanel state={state} />

        {/* Grid Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column (7 cols): Execution Timeline & Tool Panel */}
          <div className="lg:col-span-7 space-y-4">
            {/* Section 2: Agent Activity Timeline */}
            <AgentActivityTimeline
              steps={state.steps}
              activeTool={state.activeTool}
            />

            {/* Section 4: Tool Execution Panel */}
            <ToolExecutionPanel
              steps={state.steps}
              activeTool={state.activeTool}
            />
          </div>

          {/* Right Column (5 cols): Decision Panel, Adaptation, Evidence */}
          <div className="lg:col-span-5 space-y-4">
            {/* Section 3: Agent Decision Panel */}
            <AgentDecisionPanel state={state} />

            {/* Section 6: Adaptation Panel */}
            <AdaptationPanel adaptations={state.adaptations} />

            {/* Section 5: Incident Evidence */}
            <IncidentEvidencePanel evidence={state.evidence} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#23232a] bg-[#0d0d10] px-6 py-3.5 text-center text-xs font-mono text-slate-500">
        SENTINEL-X Autonomous Incident Commander · Built for Agentic AI Hackathon · Powered by Gemini
      </footer>

      {/* Modals */}
      {state.report && isReportOpen && (
        <FinalIncidentReportModal
          report={state.report}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {isWhyAgenticOpen && (
        <WhyAgenticModal onClose={() => setIsWhyAgenticOpen(false)} />
      )}
    </div>
  );
}
