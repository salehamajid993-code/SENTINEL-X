import React from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { IncidentReport } from '../types.ts';

interface FinalIncidentReportModalProps {
  report: IncidentReport;
  onClose: () => void;
}

export const FinalIncidentReportModal: React.FC<FinalIncidentReportModalProps> = ({
  report,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `SENTINEL-X INCIDENT DOSSIER
Incident ID: ${report.incidentId}
Status: ${report.finalStatus}
Type: ${report.incidentType}
Confidence: ${report.confidenceScore}%
Duration: ${report.durationSeconds}s

ACTIONS TAKEN:
${report.actionsTaken.map(a => `- ${a}`).join('\n')}

FAILED ACTIONS & ADAPTATIONS:
${report.failedActions.map(f => `- ${f}`).join('\n')}
${report.fallbackActions.map(fb => `- ${fb}`).join('\n')}

RECOMMENDATIONS:
${report.recommendations.map(r => `- ${r}`).join('\n')}

POST-MORTEM NOTE:
${report.postMortemNote}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111114] border border-[#23232a] rounded max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#23232a] flex items-center justify-between bg-[#16161c]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                  Incident Post-Mortem Dossier
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-500/40 font-bold uppercase">
                  {report.finalStatus}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Incident Reference: <span className="text-blue-400 font-semibold">{report.incidentId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#111114] hover:bg-[#1c1c24] text-slate-300 text-xs border border-[#23232a] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#1c1c24] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs text-slate-300">
          {/* Executive Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#16161c] p-3 rounded border border-[#23232a]">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Incident Type</div>
              <div className="font-bold text-blue-400">{report.incidentType}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Severity</div>
              <div className="font-bold text-red-500">{report.severity}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">AI Confidence</div>
              <div className="font-bold text-green-400">{report.confidenceScore}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Resolution Time</div>
              <div className="font-bold text-slate-200">{report.durationSeconds} seconds</div>
            </div>
          </div>

          {/* Evidence Summary */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Evidence Synthesized:</span>
            </h3>
            <div className="bg-[#16161c] p-3 rounded border border-[#23232a] space-y-1">
              {report.evidenceSummary.map((ev, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-[11px]">
                  <span className="text-blue-400">▸</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions & Failure Adaptations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Actions Taken */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-green-400 tracking-widest mb-1.5">
                Successful Actions Taken:
              </h3>
              <div className="bg-[#16161c] p-3 rounded border border-[#23232a] space-y-1.5">
                {report.actionsTaken.map((act, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[11px] text-green-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="truncate">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Actions & Fallbacks */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-amber-400 tracking-widest mb-1.5">
                Failures & Adaptive Recoveries:
              </h3>
              <div className="bg-[#16161c] p-3 rounded border border-[#23232a] space-y-1.5">
                {report.failedActions.length === 0 ? (
                  <div className="text-slate-500 text-[11px]">No failed actions recorded.</div>
                ) : (
                  report.failedActions.map((f, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))
                )}
                {report.fallbackActions.map((fb, idx) => (
                  <div key={`fb-${idx}`} className="text-[10px] text-blue-400 pl-4 border-l border-blue-500/40">
                    ↳ {fb}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">
              Hardening & Post-Mortem Recommendations:
            </h3>
            <div className="bg-[#16161c] p-3 rounded border border-[#23232a] space-y-1.5">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                  <span className="text-blue-400 font-bold">[{idx + 1}]</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Mortem Note */}
          <div className="p-3 rounded bg-[#16161c] border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
            <strong className="text-blue-400 block mb-1 uppercase tracking-wider text-[10px]">Commander Post-Mortem Assessment:</strong>
            {report.postMortemNote}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#23232a] bg-[#16161c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
