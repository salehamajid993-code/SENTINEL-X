import {
  IncidentState,
  IncidentStatus,
  SeverityLevel,
  AttackType,
  AgentPhase,
  AgentStep,
  AdaptationRecord,
  PendingApproval,
  IncidentReport
} from '../src/types.ts';
import { SimulatedSecurityEnvironment } from './simulatedEnv.ts';
import { GeminiAgentService, AgentDecision } from './geminiAgent.ts';

export class AgentController {
  private env: SimulatedSecurityEnvironment;
  private agentService: GeminiAgentService;
  private state: IncidentState;
  private stepExecutionTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: IncidentState) => void> = new Set();

  constructor() {
    this.env = new SimulatedSecurityEnvironment();
    this.agentService = new GeminiAgentService();
    this.state = this.createInitialState();
  }

  private createInitialState(): IncidentState {
    return {
      incidentId: `INC-${Date.now().toString().slice(-6)}`,
      goal: 'Investigate the current security incident and contain the threat.',
      status: 'IDLE',
      severity: 'HIGH',
      confidence: 90,
      currentObjective: 'Standing by for incident command activation.',
      attackType: 'CREDENTIAL_STUFFING',
      currentPhase: 'OBSERVE',
      steps: [],
      evidence: this.env.getFullEvidence(),
      adaptations: [],
      pendingApproval: null,
      report: null,
      mode: 'DEMO',
      supervisedMode: true,
      isRunning: false,
      activeTool: null,
      usingGeminiApi: this.agentService.isUsingGemini()
    };
  }

  public getState(): IncidentState {
    return {
      ...this.state,
      evidence: this.env.getFullEvidence(),
      usingGeminiApi: this.agentService.isUsingGemini()
    };
  }

  public subscribe(listener: (state: IncidentState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const updatedState = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(updatedState);
      } catch (err) {
        console.error('Error notifying listener:', err);
      }
    });
  }

  public reset(): IncidentState {
    if (this.stepExecutionTimer) {
      clearTimeout(this.stepExecutionTimer);
      this.stepExecutionTimer = null;
    }
    this.env.reset();
    this.state = this.createInitialState();
    this.notify();
    return this.getState();
  }

  public setSupervisedMode(supervised: boolean): IncidentState {
    this.state.supervisedMode = supervised;
    this.notify();
    return this.getState();
  }

  public startIncident(goal: string, mode: 'DEMO' | 'CUSTOM' = 'DEMO', supervised: boolean = true): IncidentState {
    this.reset();
    this.state.goal = goal || 'Investigate the current security incident and contain the threat.';
    this.state.mode = mode;
    this.state.supervisedMode = supervised;
    this.state.status = 'OBSERVING';
    this.state.currentObjective = 'Initialize autonomous investigation loop and collect perimeter telemetry.';
    this.state.currentPhase = 'OBSERVE';

    // Step 0: Goal Received event
    const initialStep: AgentStep = {
      id: `step-${Date.now()}-0`,
      stepNumber: 0,
      timestamp: new Date().toLocaleTimeString(),
      phase: 'OBSERVE',
      eventType: 'GOAL_RECEIVED',
      observation: `Received primary incident objective: "${this.state.goal}". Ingress alerts indicate active volumetric intrusion.`,
      reason: 'Agentic loop initialized: Formulating observation plan and telemetry gathering strategy.',
      confidence: 95,
      nextStep: 'Select initial diagnostic tool to query security logs.'
    };

    this.state.steps.push(initialStep);
    this.notify();
    return this.getState();
  }

  public async step(): Promise<IncidentState> {
    if (this.state.status === 'RESOLVED' || this.state.status === 'FAILED') {
      return this.getState();
    }

    if (this.state.pendingApproval) {
      return this.getState();
    }

    // Build history for the decision engine (only steps with completed tool executions)
    const history = this.state.steps
      .filter(s => s.toolName && s.toolStatus)
      .map(s => ({
        toolName: s.toolName,
        toolInput: s.toolInput,
        toolOutput: s.toolOutput,
        observation: s.observation,
        isError: s.toolStatus === 'FAILURE'
      }));

    const forceDemoSequence = this.state.mode === 'DEMO';
    const decision: AgentDecision = await this.agentService.decideNextAction(
      this.state.goal,
      history,
      this.env,
      forceDemoSequence
    );

    // Human Safety Approval Layer for High Risk Actions
    const isHighRisk = decision.toolName === 'block_ip';
    if (isHighRisk && this.state.supervisedMode) {
      this.state.pendingApproval = {
        id: `approval-${Date.now()}`,
        toolName: decision.toolName,
        input: decision.toolInput,
        riskLevel: 'HIGH',
        description: `Firewall Rule Insertion: Drop all ingress packets from IP ${decision.toolInput.ip} at perimeter gateway.`,
        reason: decision.reason,
        confidence: decision.confidence,
        timestamp: new Date().toLocaleTimeString()
      };
      this.state.status = 'AWAITING_APPROVAL';
      this.state.currentObjective = `Awaiting security operator approval for high-risk action: ${decision.toolName}`;

      const approvalStep: AgentStep = {
        id: `step-${Date.now()}-${this.state.steps.length}`,
        stepNumber: this.state.steps.length,
        timestamp: new Date().toLocaleTimeString(),
        phase: 'DECIDE',
        eventType: 'APPROVAL_REQUESTED',
        toolName: decision.toolName,
        toolInput: decision.toolInput,
        observation: `Decision made to execute high-risk perimeter block. Operator authorization is required before applying firewall rules.`,
        reason: decision.reason,
        confidence: decision.confidence,
        nextStep: 'Await operator approval or rejection.'
      };
      this.state.steps.push(approvalStep);
      this.notify();
      return this.getState();
    }

    // Execute tool directly
    await this.executeDecidedTool(decision);
    return this.getState();
  }

  public async approveAction(approved: boolean): Promise<IncidentState> {
    if (!this.state.pendingApproval) return this.getState();

    const approval = this.state.pendingApproval;
    this.state.pendingApproval = null;

    if (!approved) {
      // Operator rejected action
      const rejectionStep: AgentStep = {
        id: `step-${Date.now()}-${this.state.steps.length}`,
        stepNumber: this.state.steps.length,
        timestamp: new Date().toLocaleTimeString(),
        phase: 'ADAPT',
        eventType: 'ALTERNATIVE_SELECTED',
        toolName: approval.toolName,
        toolInput: approval.input,
        toolStatus: 'SKIPPED',
        observation: `HUMAN OPERATOR REJECTED: Authorization denied for '${approval.toolName}'. Sentinel-X must formulate an alternative non-destructive containment strategy.`,
        reason: 'Autonomous adaptation triggered by human-in-the-loop constraint.',
        confidence: 90,
        nextStep: 'Select alternative mitigation (apply_rate_limit) to achieve containment without perimeter drop.',
        isAdaptation: true
      };
      this.state.steps.push(rejectionStep);
      this.state.status = 'ADAPTING';
      this.notify();

      // If in continuous run mode, continue
      if (this.state.isRunning) {
        this.stepExecutionTimer = setTimeout(() => this.runLoop(), 1200);
      }
      return this.getState();
    }

    // Operator approved action: execute the pending tool
    const decision: AgentDecision = {
      phase: 'ACT',
      eventType: 'ACTION_ATTEMPTED',
      toolName: approval.toolName,
      toolInput: approval.input,
      observation: `Operator approved execution of ${approval.toolName}. Proceeding with perimeter mitigation.`,
      reason: approval.reason,
      confidence: approval.confidence,
      currentObjective: `Execute authorized perimeter mitigation on ${approval.input.ip || 'target'}.`,
      nextStep: 'Verify firewall rule application.',
      isAdaptation: false
    };

    await this.executeDecidedTool(decision);

    if (this.state.isRunning) {
      this.stepExecutionTimer = setTimeout(() => this.runLoop(), 1200);
    }

    return this.getState();
  }

  private async executeDecidedTool(decision: AgentDecision) {
    this.state.activeTool = decision.toolName;
    this.state.currentPhase = decision.phase;
    this.state.currentObjective = decision.currentObjective;

    const startTime = Date.now();
    let toolResult: any;
    let toolStatus: 'SUCCESS' | 'FAILURE' = 'SUCCESS';

    try {
      switch (decision.toolName) {
        case 'get_security_logs':
          toolResult = this.env.getSecurityLogs(decision.toolInput.limit);
          this.state.status = 'INVESTIGATING';
          break;
        case 'inspect_ip':
          toolResult = this.env.inspectIp(decision.toolInput.ip);
          this.state.status = 'INVESTIGATING';
          break;
        case 'check_threat_intelligence':
          toolResult = this.env.checkThreatIntelligence(decision.toolInput.ip);
          if (!toolResult.success) {
            toolStatus = 'FAILURE';
          }
          this.state.status = 'INVESTIGATING';
          break;
        case 'scan_endpoint':
          toolResult = this.env.scanEndpoint(decision.toolInput.endpoint);
          this.state.status = 'INVESTIGATING';
          break;
        case 'block_ip':
          toolResult = this.env.blockIp(decision.toolInput.ip);
          if (!toolResult.success) {
            toolStatus = 'FAILURE';
            this.state.status = 'ADAPTING';
            this.recordAdaptation(
              'block_ip',
              toolResult.message || 'Firewall rule synchronization lock error.',
              'Netfilter driver locked by concurrent daemon. Ingress flood still active. Shift strategy to Layer-7 rate limiting.',
              'apply_rate_limit'
            );
          } else {
            this.state.status = 'MITIGATING';
          }
          break;
        case 'apply_rate_limit':
          toolResult = this.env.applyRateLimit(decision.toolInput.endpoint);
          this.state.status = 'MITIGATING';
          if (decision.isAdaptation) {
            const lastAdapt = this.state.adaptations[this.state.adaptations.length - 1];
            if (lastAdapt) {
              lastAdapt.outcome = 'RECOVERED';
              lastAdapt.verificationDetails = 'Layer-7 rate limiting active. 94% reduction in load observed.';
            }
          }
          break;
        case 'check_server_health':
          toolResult = this.env.getCurrentServerHealth();
          this.state.status = 'VERIFYING';
          break;
        case 'restore_service':
          toolResult = this.env.restoreService();
          this.state.status = 'RESOLVED';
          break;
        case 'send_security_alert':
          toolResult = this.env.sendSecurityAlert(decision.toolInput.message);
          break;
        case 'generate_incident_report':
          toolResult = this.env.generateIncidentReport(decision.toolInput);
          this.state.report = this.compileIncidentReport();
          this.state.status = 'RESOLVED';
          this.state.isRunning = false;
          break;
        default:
          toolResult = { message: `Tool ${decision.toolName} executed successfully.` };
      }
    } catch (err: any) {
      toolResult = { error: err.message || 'Unknown tool execution error' };
      toolStatus = 'FAILURE';
    }

    const executionTimeMs = Date.now() - startTime;
    this.state.activeTool = null;

    // Create the step record
    const stepRecord: AgentStep = {
      id: `step-${Date.now()}-${this.state.steps.length}`,
      stepNumber: this.state.steps.length,
      timestamp: new Date().toLocaleTimeString(),
      phase: decision.phase,
      eventType: toolStatus === 'FAILURE' ? 'FAILURE_DETECTED' : decision.eventType,
      toolName: decision.toolName,
      toolInput: decision.toolInput,
      toolOutput: toolResult,
      toolStatus,
      executionTimeMs,
      observation: toolStatus === 'FAILURE'
        ? `TOOL FAILURE: ${decision.toolName} returned an error. Reason: ${toolResult.message || toolResult.error}`
        : decision.observation,
      reason: decision.reason,
      confidence: decision.confidence,
      nextStep: decision.nextStep,
      isAdaptation: decision.isAdaptation || toolStatus === 'FAILURE'
    };

    this.state.steps.push(stepRecord);
    this.notify();
  }

  private recordAdaptation(failedAction: string, failureReason: string, hypothesis: string, alternative: string) {
    const record: AdaptationRecord = {
      id: `adapt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      failedAction,
      failureReason,
      agentHypothesis: hypothesis,
      alternativeSelected: alternative,
      outcome: 'PENDING'
    };
    this.state.adaptations.push(record);
  }

  private compileIncidentReport(): IncidentReport {
    const startTime = this.state.steps[0]?.timestamp || '00:00:00';
    const endTime = new Date().toLocaleTimeString();
    const actionsTaken = this.state.steps
      .filter(s => s.toolName && s.toolStatus === 'SUCCESS')
      .map(s => `${s.toolName}(${JSON.stringify(s.toolInput || {})})`);
    
    const failedActions = this.state.steps
      .filter(s => s.toolStatus === 'FAILURE')
      .map(s => `${s.toolName}: ${s.toolOutput?.message || s.toolOutput?.error || 'Failed'}`);

    const fallbackActions = this.state.adaptations.map(
      a => `${a.failedAction} -> Failed (${a.failureReason}) -> Adapted to ${a.alternativeSelected}`
    );

    return {
      incidentId: this.state.incidentId,
      title: 'Autonomous Neutralization of Distributed Auth Flood & Credential Stuffing',
      incidentType: this.state.attackType,
      severity: this.state.severity,
      startTime,
      endTime,
      durationSeconds: Math.max(14, this.state.steps.length * 3),
      evidenceSummary: [
        `Primary attacker IP: ${this.env.primaryAttackerIp} (AS44123 - Bulletproof Hosting Ltd)`,
        `Targeted API endpoint: ${this.env.targetedEndpoint}`,
        'Attack characteristics: Volumetric 540 req/sec POST flood causing 46.8% server 503 error rate',
        'Payload pattern: Mirai-variant/4.1 credential dictionary spray'
      ],
      actionsTaken,
      failedActions,
      fallbackActions,
      finalStatus: 'CONTAINED_AND_RESOLVED',
      confidenceScore: 98,
      recommendations: [
        'Harden perimeter firewall netfilter synchronization locks to prevent concurrent rule update failures.',
        'Permanently maintain adaptive ingress rate-limiting policy on /api/v1/auth/* endpoints.',
        'Enforce CAPTCHA step-up challenges for IP reputation scores above 75.',
        'Configure multi-region secondary Threat Intel fallback proxies.'
      ],
      postMortemNote: 'SENTINEL-X demonstrated true autonomous resilience: when the perimeter firewall block failed due to driver lock contention, the agent automatically diagnosed the failure, reasoned through alternative mitigations, engaged Layer-7 token-bucket rate limiting, verified server stabilization, and safely restored services.'
    };
  }

  public async runContinuously(): Promise<IncidentState> {
    this.state.isRunning = true;
    this.notify();
    await this.runLoop();
    return this.getState();
  }

  public stopContinuousRun(): IncidentState {
    this.state.isRunning = false;
    if (this.stepExecutionTimer) {
      clearTimeout(this.stepExecutionTimer);
      this.stepExecutionTimer = null;
    }
    this.notify();
    return this.getState();
  }

  private async runLoop() {
    if (!this.state.isRunning) return;
    if ((this.state.status as IncidentStatus) === 'RESOLVED' || (this.state.status as IncidentStatus) === 'FAILED') {
      this.state.isRunning = false;
      this.notify();
      return;
    }
    if (this.state.pendingApproval) {
      // Pause until user decision
      this.notify();
      return;
    }

    const updated = await this.step();

    if (updated.isRunning && updated.status !== 'RESOLVED' && !updated.pendingApproval) {
      this.stepExecutionTimer = setTimeout(() => this.runLoop(), 1500);
    } else if (updated.status === 'RESOLVED') {
      this.state.isRunning = false;
      this.notify();
    }
  }
}

export const agentController = new AgentController();
