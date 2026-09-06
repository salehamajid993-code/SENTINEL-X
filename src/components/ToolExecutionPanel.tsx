import React, { useState } from 'react';
import { 
  Wrench, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Code2, 
  Copy, 
  Check,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { AgentStep } from '../types.ts';

interface ToolExecutionPanelProps {
  steps: AgentStep[];
  activeTool: string | null;
}

export const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({ steps, activeTool }) => {
  const executedToolSteps = steps.filter(s => s.toolName);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active step selected or latest executed step
  const activeStep = selectedStepId 
    ? executedToolSteps.find(s => s.id === selectedStepId) 
    : executedToolSteps[executedToolSteps.length - 1];

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111114] border border-[#23232a] rounded p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23232a] mb-3">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-blue-500" />
          <h2 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
            Tool Execution
          </h2>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          INVOCATIONS: <strong className="text-blue-400">{executedToolSteps.length}</strong>
        </div>
      </div>

      {/* Two columns: Tool List + Inspection Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left column: Tool execution history */}
        <div className="md:col-span-4 border border-[#23232a] rounded bg-[#16161c] p-2 overflow-y-auto custom-scrollbar max-h-[360px] space-y-1.5 font-mono text-xs">
          {executedToolSteps.length === 0 ? (
            <div className="text-slate-500 text-center py-8 text-[11px]">
              No tools invoked yet.
            </div>
          ) : (
            executedToolSteps.map((s) => {
              const isSelected = activeStep?.id === s.id;
              const isSuccess = s.toolStatus === 'SUCCESS';
              const isFail = s.toolStatus === 'FAILURE';

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStepId(s.id)}
                  className={`w-full text-left p-2 rounded transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-[#1c1c24] border-blue-500/50 text-blue-400'
                      : 'bg-[#111114] border-[#23232a] hover:bg-[#16161c] text-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="font-semibold truncate text-[11px] flex items-center space-x-1">
                      {isSuccess ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      ) : isFail ? (
                        <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{s.toolName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>#{s.stepNumber}</span>
                      <span>{s.executionTimeMs}ms</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Right column: Inspector */}
        <div className="md:col-span-8 border border-[#23232a] rounded bg-[#16161c] p-3 flex flex-col font-mono text-xs overflow-hidden">
          {activeStep ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {/* Tool Header Meta */}
              <div className="flex items-center justify-between pb-2 border-b border-[#23232a]">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-blue-400">
                    {activeStep.toolName}()
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                    activeStep.toolStatus === 'SUCCESS'
                      ? 'bg-green-950/60 text-green-400 border-green-500/40'
                      : 'bg-red-950/60 text-red-400 border-red-500/50'
                  }`}>
                    {activeStep.toolStatus}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{activeStep.executionTimeMs} ms</span>
                  </span>
                  <button
                    onClick={() => handleCopyJson(activeStep.toolOutput)}
                    className="p-1 rounded bg-[#111114] hover:bg-[#1c1c24] text-slate-400 hover:text-slate-200 border border-[#23232a] transition-colors"
                    title="Copy payload to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Input section */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center space-x-1">
                  <Code2 className="w-3 h-3 text-blue-400" />
                  <span>Invocation Parameters</span>
                </div>
                <pre className="p-2.5 rounded bg-[#111114] border border-[#23232a] text-[11px] text-blue-300 overflow-x-auto">
                  {JSON.stringify(activeStep.toolInput || {}, null, 2)}
                </pre>
              </div>

              {/* Output section */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center space-x-1">
                  <Terminal className="w-3 h-3 text-green-400" />
                  <span>Result Payload</span>
                </div>
                <pre className={`p-2.5 rounded border text-[11px] overflow-x-auto ${
                  activeStep.toolStatus === 'FAILURE'
                    ? 'bg-red-950/20 text-red-200 border-red-800/40'
                    : 'bg-[#111114] text-slate-200 border-[#23232a]'
                }`}>
                  {JSON.stringify(activeStep.toolOutput || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
              <Code2 className="w-8 h-8 opacity-40 mb-2 text-slate-400" />
              <span>Select a tool execution from the left panel to inspect parameters and payload.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
