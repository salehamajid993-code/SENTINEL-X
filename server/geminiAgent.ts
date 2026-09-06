import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SimulatedSecurityEnvironment } from "./simulatedEnv.ts";
import { AgentPhase, StepEventType } from "../src/types.ts";

export const securityToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_security_logs",
    description: "Fetches recent ingress, WAF, and authentication security logs to detect anomalies, traffic surges, and attacker IPs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Number of log records to retrieve, defaults to 10"
        }
      }
    }
  },
  {
    name: "inspect_ip",
    description: "Performs deep forensic inspection on an IP address including ASN, geolocation, request frequency, and attack signatures.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ip: {
          type: Type.STRING,
          description: "The IPv4 or IPv6 address to inspect (e.g. '198.51.100.42')"
        }
      },
      required: ["ip"]
    }
  },
  {
    name: "check_threat_intelligence",
    description: "Queries external global threat intelligence databases (VirusTotal, AlienVault OTX) for reputation and known C2 botnet associations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ip: {
          type: Type.STRING,
          description: "The target IP address to check"
        }
      },
      required: ["ip"]
    }
  },
  {
    name: "scan_endpoint",
    description: "Audits a targeted application endpoint for active latency, queue saturation, error rates, and active rate limiting status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        endpoint: {
          type: Type.STRING,
          description: "The API endpoint URI path (e.g. '/api/v1/auth/login')"
        }
      },
      required: ["endpoint"]
    }
  },
  {
    name: "check_server_health",
    description: "Queries live application cluster health metrics: CPU usage, memory, error rates, and connection pools.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "block_ip",
    description: "CRITICAL ACTION: Inserts an immediate perimeter firewall/WAF rule to drop all incoming packets from an attacker IP.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ip: {
          type: Type.STRING,
          description: "Attacker IP address to block"
        }
      },
      required: ["ip"]
    }
  },
  {
    name: "apply_rate_limit",
    description: "Applies strict token-bucket rate limiting at the ingress API gateway to throttle abusive requests to an endpoint.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        endpoint: {
          type: Type.STRING,
          description: "Endpoint to protect with rate limiting (e.g. '/api/v1/auth/login')"
        }
      },
      required: ["endpoint"]
    }
  },
  {
    name: "restore_service",
    description: "Restores normal cluster operational state: flushes clogged worker queues, restarts starved pod replicas, and clears caches.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "send_security_alert",
    description: "Dispatches priority security notifications to SOC channels, incident command, and on-call engineers.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: {
          type: Type.STRING,
          description: "Detailed alert summary containing incident findings and actions taken"
        }
      },
      required: ["message"]
    }
  },
  {
    name: "generate_incident_report",
    description: "Compiles a final comprehensive incident response report summarizing findings, actions, failed attempts, adaptations, and post-mortem recommendations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "High-level summary of the incident resolution"
        }
      }
    }
  }
];

export interface AgentDecision {
  phase: AgentPhase;
  eventType: StepEventType;
  toolName: string;
  toolInput: Record<string, any>;
  observation: string;
  reason: string;
  confidence: number;
  currentObjective: string;
  nextStep: string;
  isAdaptation: boolean;
}

export class GeminiAgentService {
  private ai: GoogleGenAI | null = null;
  private hasApiKey: boolean = false;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim().length > 0) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        this.hasApiKey = true;
      } catch (err) {
        console.warn("Could not initialize GoogleGenAI client:", err);
        this.hasApiKey = false;
      }
    }
  }

  public isUsingGemini(): boolean {
    return this.hasApiKey && this.ai !== null;
  }

  /**
   * Decide the next action using Gemini with structured tool declarations,
   * with guaranteed deterministic agentic fallback if API key is not configured or in DEMO mode.
   */
  public async decideNextAction(
    goal: string,
    history: Array<{ toolName?: string; toolInput?: any; toolOutput?: any; observation?: string; isError?: boolean }>,
    env: SimulatedSecurityEnvironment,
    forceDemoSequence: boolean = false
  ): Promise<AgentDecision> {
    const stepCount = history.length;
    const lastStep = stepCount > 0 ? history[stepCount - 1] : null;

    // Check if the last action failed (e.g. firewall block failed or threat intel failed)
    const hasPriorFailure = history.some(h => h.isError);

    // If not in forced demo mode and Gemini API is ready, attempt Gemini model call
    if (!forceDemoSequence && this.isUsingGemini() && this.ai) {
      try {
        const decisionFromGemini = await this.queryGeminiForDecision(goal, history, env);
        if (decisionFromGemini) {
          return decisionFromGemini;
        }
      } catch (err) {
        console.warn("Gemini API call fell back to autonomous rule engine:", err);
      }
    }

    // Deterministic Hackathon Demo / Fallback Execution Flow:
    // Demonstrates: OBSERVE → PLAN → INVESTIGATE → DECIDE → ACT → FAILURE → ADAPT → VERIFY → RESOLVE
    return this.getDeterministicDemoDecision(stepCount, history, env);
  }

  private async queryGeminiForDecision(
    goal: string,
    history: Array<{ toolName?: string; toolInput?: any; toolOutput?: any; observation?: string; isError?: boolean }>,
    env: SimulatedSecurityEnvironment
  ): Promise<AgentDecision | null> {
    if (!this.ai) return null;

    const systemPrompt = `You are SENTINEL-X, an elite Autonomous AI Cybersecurity Incident Commander.
Your operating loop is: OBSERVE → PLAN → INVESTIGATE → DECIDE → ACT → VERIFY → ADAPT → RESOLVE.
You must analyze the current security state and select the single best tool to achieve the objective: "${goal}".
CRITICAL:
- If a tool fails (e.g., Firewall block returns lock error or Threat Intel times out), you MUST DETECT THE FAILURE and dynamically ADAPT to an alternative mitigation (e.g., apply_rate_limit on the affected endpoint, or rely on local endpoint scans).
- Never give up on failure; formulate an adaptation strategy.
- When threat is mitigated, verify server health, restore services, and generate the incident report.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nIncident Goal: ${goal}\nPrevious Execution History:\n${JSON.stringify(history, null, 2)}\n\nSelect the next tool and specify the arguments.`
          }
        ]
      }
    ];

    const response = await this.ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contents as any,
      config: {
        tools: [{ functionDeclarations: securityToolDeclarations }]
      }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolName = call.name;
      const toolInput = (call.args as Record<string, any>) || {};

      let phase: AgentPhase = 'INVESTIGATE';
      let eventType: StepEventType = 'TOOL_SELECTED';
      let isAdaptation = false;

      if (toolName === 'get_security_logs') {
        phase = 'OBSERVE';
        eventType = 'EVIDENCE_COLLECTED';
      } else if (toolName === 'block_ip' || toolName === 'apply_rate_limit') {
        phase = 'ACT';
        eventType = 'ACTION_ATTEMPTED';
        if (toolName === 'apply_rate_limit' && history.some(h => h.toolName === 'block_ip' && h.isError)) {
          isAdaptation = true;
          phase = 'ADAPT';
          eventType = 'ALTERNATIVE_SELECTED';
        }
      } else if (toolName === 'check_server_health') {
        phase = 'VERIFY';
        eventType = 'RECOVERY_VERIFIED';
      } else if (toolName === 'generate_incident_report' || toolName === 'restore_service') {
        phase = 'RESOLVE';
        eventType = 'RESOLVED';
      }

      return {
        phase,
        eventType,
        toolName,
        toolInput,
        observation: `Gemini selected tool '${toolName}' based on evidence and objective.`,
        reason: `Executing ${toolName} to advance containment of the active threat.`,
        confidence: 94,
        currentObjective: `Mitigate and resolve ${goal}`,
        nextStep: `Analyze output of ${toolName}`,
        isAdaptation
      };
    }

    return null;
  }

  private getDeterministicDemoDecision(
    stepIndex: number,
    history: Array<{ toolName?: string; toolInput?: any; toolOutput?: any; observation?: string; isError?: boolean }>,
    env: SimulatedSecurityEnvironment
  ): AgentDecision {
    const hasTool = (name: string) => history.some(h => h.toolName === name);

    // Step 0: Initial Ingress Observation
    if (!hasTool('get_security_logs')) {
      return {
        phase: 'OBSERVE',
        eventType: 'TOOL_SELECTED',
        toolName: 'get_security_logs',
        toolInput: { limit: 10 },
        observation: 'Initial breach alerts detected. Ingress traffic spikes on auth tier with high 503 error rate.',
        reason: 'Retrieve ingress and WAF security access logs to identify attacker IP and target attack vector.',
        confidence: 98,
        currentObjective: 'Identify primary attack vector and source IP from telemetry logs.',
        nextStep: 'Inspect suspicious IP address retrieved from logs.',
        isAdaptation: false
      };
    }

    // Step 1: Deep IP Inspection
    if (!hasTool('inspect_ip')) {
      return {
        phase: 'INVESTIGATE',
        eventType: 'TOOL_SELECTED',
        toolName: 'inspect_ip',
        toolInput: { ip: env.primaryAttackerIp },
        observation: `Logs reveal massive request flood (540 req/s) originating from IP ${env.primaryAttackerIp} hitting ${env.targetedEndpoint}.`,
        reason: `Run deep packet and signature inspection on ${env.primaryAttackerIp} to check for botnet signatures and targeted endpoints.`,
        confidence: 96,
        currentObjective: `Confirm adversary profile for ${env.primaryAttackerIp}.`,
        nextStep: 'Query global threat intelligence database.',
        isAdaptation: false
      };
    }

    // Step 2: Query External Threat Intel (Demonstrates Failure 1)
    if (!hasTool('check_threat_intelligence')) {
      return {
        phase: 'INVESTIGATE',
        eventType: 'TOOL_SELECTED',
        toolName: 'check_threat_intelligence',
        toolInput: { ip: env.primaryAttackerIp },
        observation: `IP inspection verified malicious credential spray signature from Bulletproof ASN AS44123.`,
        reason: 'Cross-reference attacker IP against global C2 botnet threat databases.',
        confidence: 92,
        currentObjective: 'Correlate attacker with known threat actors and reputation lists.',
        nextStep: 'Analyze threat intel response or fallback to endpoint audit.',
        isAdaptation: false
      };
    }

    // Step 3: Endpoint Scan (Investigate Affected Service)
    if (!hasTool('scan_endpoint')) {
      return {
        phase: 'INVESTIGATE',
        eventType: 'TOOL_SELECTED',
        toolName: 'scan_endpoint',
        toolInput: { endpoint: env.targetedEndpoint },
        observation: 'Threat Intelligence API experienced a 504 Gateway Timeout. Sentinel-X adapts by prioritizing local endpoint telemetry.',
        reason: `Audit endpoint ${env.targetedEndpoint} to measure active queue depth, worker starvation, and error blast radius.`,
        confidence: 94,
        currentObjective: `Assess degradation of ${env.targetedEndpoint}.`,
        nextStep: 'Execute perimeter firewall block on attacker IP.',
        isAdaptation: false
      };
    }

    // Step 4: First Mitigation Attempt -> block_ip (Demonstrates Failure 2 & Adaptation trigger)
    if (!hasTool('block_ip') && !hasTool('apply_rate_limit')) {
      return {
        phase: 'ACT',
        eventType: 'ACTION_ATTEMPTED',
        toolName: 'block_ip',
        toolInput: { ip: env.primaryAttackerIp },
        observation: `Endpoint scan confirms severe worker starvation: 1840 queue depth, 47.3% error rate, 1450ms latency. Immediate containment required.`,
        reason: `Issue perimeter firewall drop rule for primary attacker ${env.primaryAttackerIp}. Requires safety approval in supervised mode.`,
        confidence: 95,
        currentObjective: `Sever ingress connections from ${env.primaryAttackerIp} via firewall drop.`,
        nextStep: 'Verify firewall rule application.',
        isAdaptation: false
      };
    }

    // Step 5: ADAPTATION! Firewall block failed due to WAF lock -> Agent dynamically selects apply_rate_limit
    if (!hasTool('apply_rate_limit')) {
      return {
        phase: 'ADAPT',
        eventType: 'ALTERNATIVE_SELECTED',
        toolName: 'apply_rate_limit',
        toolInput: { endpoint: env.targetedEndpoint },
        observation: 'FAILURE DETECTED: Perimeter firewall rejected block_ip due to kernel netfilter lock conflict. Threat is still actively flooding.',
        reason: 'ADAPTATION STRATEGY: Pivot from network perimeter blocking to application-layer rate limiting on /api/v1/auth/login. This throttles malicious flood at reverse proxy without needing firewall locks.',
        confidence: 97,
        currentObjective: 'Apply fallback Layer-7 rate limiting to choke volumetric abuse.',
        nextStep: 'Verify server health recovery after rate limit application.',
        isAdaptation: true
      };
    }

    // Step 6: Verify Recovery
    if (!hasTool('check_server_health')) {
      return {
        phase: 'VERIFY',
        eventType: 'TOOL_SELECTED',
        toolName: 'check_server_health',
        toolInput: {},
        observation: 'Rate limiting successfully engaged: Strict 10 req/min token bucket active on /api/v1/auth/login.',
        reason: 'Verify cluster telemetry to confirm error rate drop, worker queue stabilization, and latency recovery.',
        confidence: 98,
        currentObjective: 'Confirm telemetry recovery and threat containment.',
        nextStep: 'Restore full service and restart starved worker replicas.',
        isAdaptation: false
      };
    }

    // Step 7: Restore Service
    if (!hasTool('restore_service')) {
      return {
        phase: 'ACT',
        eventType: 'TOOL_SELECTED',
        toolName: 'restore_service',
        toolInput: {},
        observation: 'Health verification confirmed error rate collapsed to 1.2% and latency returned under 100ms.',
        reason: 'Flush worker connection backlogs and restart degraded microservice replicas to return cluster to optimal baseline.',
        confidence: 99,
        currentObjective: 'Restore services to pristine operational status.',
        nextStep: 'Dispatch security alert to SOC team.',
        isAdaptation: false
      };
    }

    // Step 8: Send Security Alert
    if (!hasTool('send_security_alert')) {
      return {
        phase: 'RESOLVE',
        eventType: 'TOOL_SELECTED',
        toolName: 'send_security_alert',
        toolInput: {
          message: `INCIDENT RESOLVED: Volumetric credential stuffing attack against ${env.targetedEndpoint} mitigated. Firewall block failure adapted via Ingress Token Bucket rate limiting. Latency normalized to 42ms.`
        },
        observation: 'Services restored to optimal state (CPU 22%, Latency 42ms, Error rate 0.1%).',
        reason: 'Notify SecOps war room and incident commanders of successful threat containment and resilience adaptation.',
        confidence: 100,
        currentObjective: 'Broadcast incident resolution notification.',
        nextStep: 'Generate formal SOC incident post-mortem dossier.',
        isAdaptation: false
      };
    }

    // Step 9: Generate Incident Report
    return {
      phase: 'RESOLVE',
      eventType: 'RESOLVED',
      toolName: 'generate_incident_report',
      toolInput: {
        summary: 'Autonomous AI Incident Commander successfully neutralized distributed credential attack through adaptive fallback mechanisms.'
      },
      observation: 'Threat neutralized, cluster operational, notification broadcasted.',
      reason: 'Compile structured incident report detailing evidence, failed firewall attempt, successful rate-limiting adaptation, and hardening recommendations.',
      confidence: 100,
      currentObjective: 'Finalize incident closure and archive report.',
      nextStep: 'Incident complete.',
      isAdaptation: false
    };
  }
}
