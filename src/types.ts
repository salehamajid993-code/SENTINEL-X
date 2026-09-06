export type IncidentStatus = 
  | 'IDLE'
  | 'OBSERVING'
  | 'INVESTIGATING'
  | 'AWAITING_APPROVAL'
  | 'MITIGATING'
  | 'ADAPTING'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'FAILED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AttackType = 
  | 'CREDENTIAL_STUFFING'
  | 'API_RATE_ABUSE'
  | 'DDOS_FLOOD'
  | 'DATA_EXFILTRATION'
  | 'UNAUTHORIZED_ACCESS'
  | 'UNKNOWN';

export type AgentPhase = 
  | 'OBSERVE'
  | 'PLAN'
  | 'INVESTIGATE'
  | 'DECIDE'
  | 'ACT'
  | 'VERIFY'
  | 'ADAPT'
  | 'RESOLVE';

export type StepEventType = 
  | 'GOAL_RECEIVED'
  | 'EVIDENCE_COLLECTED'
  | 'TOOL_SELECTED'
  | 'TOOL_EXECUTED'
  | 'RESULT_RECEIVED'
  | 'DECISION_MADE'
  | 'ACTION_ATTEMPTED'
  | 'FAILURE_DETECTED'
  | 'ALTERNATIVE_SELECTED'
  | 'RECOVERY_VERIFIED'
  | 'APPROVAL_REQUESTED'
  | 'RESOLVED';

export interface AgentStep {
  id: string;
  stepNumber: number;
  timestamp: string;
  phase: AgentPhase;
  eventType: StepEventType;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any>;
  toolStatus?: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'SKIPPED';
  executionTimeMs?: number;
  observation?: string;
  reason?: string;
  confidence: number; // 0 - 100
  nextStep?: string;
  isAdaptation?: boolean;
}

export interface SuspiciousIP {
  ip: string;
  requestCount: number;
  threatScore: number;
  country: string;
  asn: string;
  userAgent: string;
  flaggedBehaviors: string[];
}

export interface RequestMetric {
  timestamp: string;
  endpoint: string;
  statusCode: number;
  requestsPerSec: number;
  errorRatePercent: number;
}

export interface ServerHealth {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  errorRate: number; // percentage
  activeConnections: number;
  latencyMs: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface IncidentEvidence {
  suspiciousIps: SuspiciousIP[];
  requestMetrics: RequestMetric[];
  threatScore: number;
  affectedEndpoint: string;
  serverHealth: ServerHealth;
  collectedEvidence: string[];
  blockedIps: string[];
  rateLimitedEndpoints: string[];
  serviceRestored: boolean;
}

export interface AdaptationRecord {
  id: string;
  timestamp: string;
  failedAction: string;
  failureReason: string;
  agentHypothesis: string;
  alternativeSelected: string;
  outcome: 'RECOVERED' | 'PENDING' | 'FAILED';
  verificationDetails?: string;
}

export interface PendingApproval {
  id: string;
  toolName: string;
  input: Record<string, any>;
  riskLevel: 'LOW' | 'HIGH';
  description: string;
  reason: string;
  confidence: number;
  timestamp: string;
}

export interface IncidentReport {
  incidentId: string;
  title: string;
  incidentType: AttackType;
  severity: SeverityLevel;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  evidenceSummary: string[];
  actionsTaken: string[];
  failedActions: string[];
  fallbackActions: string[];
  finalStatus: 'CONTAINED_AND_RESOLVED' | 'UNRESOLVED' | 'ESCALATED';
  confidenceScore: number;
  recommendations: string[];
  postMortemNote: string;
}

export interface IncidentState {
  incidentId: string;
  goal: string;
  status: IncidentStatus;
  severity: SeverityLevel;
  confidence: number;
  currentObjective: string;
  attackType: AttackType;
  currentPhase: AgentPhase;
  steps: AgentStep[];
  evidence: IncidentEvidence;
  adaptations: AdaptationRecord[];
  pendingApproval: PendingApproval | null;
  report: IncidentReport | null;
  mode: 'DEMO' | 'CUSTOM';
  supervisedMode: boolean;
  isRunning: boolean;
  activeTool: string | null;
  usingGeminiApi: boolean;
}
