import React from 'react';
import { 
  FileSearch, 
  ShieldAlert, 
  Server, 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  Globe, 
  Cpu, 
  Layers,
  Lock,
  Zap
} from 'lucide-react';
import { IncidentEvidence } from '../types.ts';

interface IncidentEvidencePanelProps {
  evidence: IncidentEvidence;
}

export const IncidentEvidencePanel: React.FC<IncidentEvidencePanelProps> = ({ evidence }) => {
  const health = evidence.serverHealth;
  const isHealthy = health.status === 'HEALTHY';
  const isCritical = health.status === 'CRITICAL';

  return (
    <div className="bg-[#111114] border border-[#23232a] rounded p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23232a] mb-3">
        <div className="flex items-center space-x-2">
          <FileSearch className="w-4 h-4 text-blue-500" />
          <h2 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
            Forensic Evidence & Telemetry
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Threat Score:</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            evidence.threatScore > 70 
              ? 'bg-red-950/80 text-red-400 border-red-500/60' 
              : 'bg-emerald-950/80 text-green-400 border-emerald-500/60'
          }`}>
            {evidence.threatScore} / 100
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 font-mono text-xs">
        {/* Cluster Health Metrics Card */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center space-x-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Application Cluster Health</span>
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${
              isHealthy 
                ? 'bg-green-950/60 text-green-400 border-green-500/40' 
                : 'bg-red-950/60 text-red-400 border-red-500/50 animate-pulse'
            }`}>
              {health.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="bg-[#111114] p-2 rounded border border-[#23232a]">
              <div className="text-[9px] text-slate-500 uppercase">CPU Usage</div>
              <div className={`text-sm font-bold ${health.cpuUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                {health.cpuUsage}%
              </div>
            </div>
            <div className="bg-[#111114] p-2 rounded border border-[#23232a]">
              <div className="text-[9px] text-slate-500 uppercase">Memory</div>
              <div className={`text-sm font-bold ${health.memoryUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                {health.memoryUsage}%
              </div>
            </div>
            <div className="bg-[#111114] p-2 rounded border border-[#23232a]">
              <div className="text-[9px] text-slate-500 uppercase">Error Rate</div>
              <div className={`text-sm font-bold ${health.errorRate > 10 ? 'text-red-400' : 'text-green-400'}`}>
                {health.errorRate}%
              </div>
            </div>
            <div className="bg-[#111114] p-2 rounded border border-[#23232a]">
              <div className="text-[9px] text-slate-500 uppercase">Connections</div>
              <div className="text-sm font-bold text-slate-200">
                {health.activeConnections}
              </div>
            </div>
            <div className="bg-[#111114] p-2 rounded border border-[#23232a] col-span-2 sm:col-span-1">
              <div className="text-[9px] text-slate-500 uppercase">Latency</div>
              <div className={`text-sm font-bold ${health.latencyMs > 500 ? 'text-red-400' : 'text-green-400'}`}>
                {health.latencyMs} ms
              </div>
            </div>
          </div>
        </div>

        {/* Suspicious Attacker IPs Table */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>Adversary IP Addresses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#23232a] text-slate-500 text-[10px] uppercase">
                  <th className="pb-1.5 font-bold">Attacker IP</th>
                  <th className="pb-1.5 font-bold">Origin</th>
                  <th className="pb-1.5 font-bold">Threat</th>
                  <th className="pb-1.5 font-bold">Requests</th>
                  <th className="pb-1.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232a]">
                {evidence.suspiciousIps.map((item) => (
                  <tr key={item.ip} className="text-slate-300">
                    <td className="py-2 text-blue-400 font-bold">{item.ip}</td>
                    <td className="py-2 text-slate-400">{item.country} ({item.asn})</td>
                    <td className="py-2">
                      <span className="text-red-400 font-bold bg-red-950/40 px-1.5 py-0.2 rounded border border-red-800/40">
                        {item.threatScore}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">{item.requestCount} reqs</td>
                    <td className="py-2">
                      {evidence.blockedIps.includes(item.ip) ? (
                        <span className="text-green-400 bg-green-950/60 px-1.5 py-0.2 rounded border border-green-500/40 text-[10px] font-bold">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/40 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affected Endpoint & Rate Limit Status */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center space-x-1.5 font-bold">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Targeted Perimeter</span>
            </span>
            {evidence.rateLimitedEndpoints.includes(evidence.affectedEndpoint) ? (
              <span className="text-[9px] text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-500/40 font-bold uppercase">
                RATE LIMIT APPLIED
              </span>
            ) : (
              <span className="text-[9px] text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40 font-bold uppercase">
                EXPOSED
              </span>
            )}
          </div>
          <div className="text-blue-400 font-semibold text-xs">
            {evidence.affectedEndpoint}
          </div>
          <div className="text-slate-500 text-[10px] mt-1">
            Backend: <code className="text-slate-400">svc-auth-core-deployment (k8s)</code>
          </div>
        </div>

        {/* Evidence Collected Checklist */}
        <div className="bg-[#16161c] border border-[#23232a] rounded p-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span>Accumulated Evidence Dossier</span>
          </div>
          <ul className="space-y-1.5 text-slate-300">
            {evidence.collectedEvidence.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-[11px]">
                <span className="text-blue-400 font-bold shrink-0">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
