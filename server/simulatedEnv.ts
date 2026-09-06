import { IncidentEvidence, ServerHealth, SuspiciousIP, RequestMetric } from '../src/types.ts';

export class SimulatedSecurityEnvironment {
  // Demo failure flags
  public threatIntelFails: boolean = true;
  public firewallBlockFails: boolean = true;

  // Environment state
  public blockedIps: Set<string> = new Set();
  public rateLimitedEndpoints: Set<string> = new Set();
  public serviceRestored: boolean = false;
  public alertsSent: string[] = [];

  // Initial suspicious attacker IP in demo
  public readonly primaryAttackerIp = '198.51.100.42';
  public readonly secondaryAttackerIp = '203.0.113.19';
  public readonly targetedEndpoint = '/api/v1/auth/login';

  constructor() {
    this.reset();
  }

  public reset() {
    this.threatIntelFails = true;
    this.firewallBlockFails = true;
    this.blockedIps.clear();
    this.rateLimitedEndpoints.clear();
    this.serviceRestored = false;
    this.alertsSent = [];
  }

  public getCurrentServerHealth(): ServerHealth {
    if (this.serviceRestored) {
      return {
        cpuUsage: 22,
        memoryUsage: 34,
        errorRate: 0.1,
        activeConnections: 180,
        latencyMs: 42,
        status: 'HEALTHY'
      };
    }

    if (this.rateLimitedEndpoints.has(this.targetedEndpoint) || this.blockedIps.has(this.primaryAttackerIp)) {
      return {
        cpuUsage: 38,
        memoryUsage: 45,
        errorRate: 1.2,
        activeConnections: 350,
        latencyMs: 95,
        status: 'HEALTHY'
      };
    }

    // Degraded / Critical under attack
    return {
      cpuUsage: 91,
      memoryUsage: 84,
      errorRate: 46.8,
      activeConnections: 4820,
      latencyMs: 1680,
      status: 'CRITICAL'
    };
  }

  public getSecurityLogs(limit: number = 10) {
    const timestamp = new Date().toISOString();
    return {
      source: 'WAF_INGRESS_GATEWAY_V3',
      queryWindow: 'Last 15 minutes',
      totalAnalyzed: 14250,
      anomalousCount: 3890,
      clusterSummary: {
        dominantTarget: this.targetedEndpoint,
        burstRate: '540 requests/sec',
        httpMethod: 'POST',
        topSourceIps: [
          { ip: this.primaryAttackerIp, count: 2840, errorCount: 2310, country: 'RO' },
          { ip: this.secondaryAttackerIp, count: 1050, errorCount: 880, country: 'BG' }
        ],
        payloadFingerprint: 'Credential spray dictionary attack with randomized User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mirai-variant/4.1'
      },
      recentEvents: [
        { id: 'LOG-9401', timestamp, ip: this.primaryAttackerIp, endpoint: this.targetedEndpoint, status: 503, message: 'Upstream auth connection timeout' },
        { id: 'LOG-9402', timestamp, ip: this.primaryAttackerIp, endpoint: this.targetedEndpoint, status: 429, message: 'Excessive concurrent attempts detected' },
        { id: 'LOG-9403', timestamp, ip: this.secondaryAttackerIp, endpoint: this.targetedEndpoint, status: 503, message: 'Worker pool starvation on auth-service-pod-04' },
        { id: 'LOG-9404', timestamp, ip: this.primaryAttackerIp, endpoint: this.targetedEndpoint, status: 401, message: 'Rapid brute-force password failure' }
      ]
    };
  }

  public inspectIp(ip: string) {
    if (ip === this.primaryAttackerIp || ip === this.secondaryAttackerIp) {
      return {
        ip,
        asn: 'AS44123 (Bulletproof Hosting Ltd)',
        country: ip === this.primaryAttackerIp ? 'Romania' : 'Bulgaria',
        city: ip === this.primaryAttackerIp ? 'Bucharest' : 'Sofia',
        isProxyOrTor: true,
        reputationRisk: 'CRITICAL',
        totalRequestsIn10m: 4280,
        requestFrequencyPerSec: 512,
        attackSignatures: [
          'BruteForce.CredentialStuffing.KnownBot',
          'HTTP.PostFlood.AuthBypassAttempt',
          'Volumetric.ConnectionExhaustion'
        ],
        targetedEndpoints: [this.targetedEndpoint, '/api/v1/auth/refresh'],
        currentStatus: this.blockedIps.has(ip) ? 'BLOCKED_BY_FIREWALL' : 'ACTIVE_INTRUSION'
      };
    }

    return {
      ip,
      asn: 'AS15169 (Google LLC)',
      country: 'United States',
      city: 'Mountain View',
      isProxyOrTor: false,
      reputationRisk: 'LOW',
      totalRequestsIn10m: 14,
      requestFrequencyPerSec: 0.1,
      attackSignatures: [],
      targetedEndpoints: ['/api/v1/dashboard'],
      currentStatus: 'BENIGN'
    };
  }

  public checkThreatIntelligence(ip: string) {
    // Failure simulation point 1: External threat intel gateway times out or rate limits
    if (this.threatIntelFails) {
      // Toggle failure so subsequent retry could succeed, but immediately return realistic failure
      this.threatIntelFails = false;
      return {
        success: false,
        error: 'GATEWAY_TIMEOUT_504',
        message: 'External Threat Intelligence Feed (AlienVault/VirusTotal API) timed out after 5000ms. Service currently experiencing upstream throttling.',
        recoveryHint: 'Rely on local packet inspection (inspect_ip) and endpoint metrics (scan_endpoint) to confirm attack signature without external feed dependency.'
      };
    }

    return {
      success: true,
      ip,
      threatScore: 96,
      knownC2Server: true,
      botnetFamily: 'DarkHydra Credential Botnet Cluster #81',
      reportedAbuseReportsCount: 418,
      recommendedMitigation: 'Immediate Layer-7 Ingress Drop & Endpoint Rate Throttling'
    };
  }

  public scanEndpoint(endpoint: string) {
    const isUnderAttack = !this.rateLimitedEndpoints.has(endpoint) && !this.blockedIps.has(this.primaryAttackerIp);
    return {
      endpoint,
      protocol: 'HTTPS/2',
      backendService: 'svc-auth-core-deployment',
      queueDepth: isUnderAttack ? 1840 : 12,
      averageLatencyMs: isUnderAttack ? 1450 : 38,
      errorRatePercent: isUnderAttack ? 47.3 : 0.2,
      activeRateLimiting: this.rateLimitedEndpoints.has(endpoint),
      currentThrottlingRules: this.rateLimitedEndpoints.has(endpoint) ? '10 req/min per IP burst' : 'NONE',
      vulnerabilityStatus: 'No zero-day code vulnerability found. Bottleneck is volumetric auth worker starvation.'
    };
  }

  public blockIp(ip: string) {
    // Failure simulation point 2: Firewall rule update lock failure
    if (this.firewallBlockFails) {
      this.firewallBlockFails = false; // After detecting failure, next attempt or adaptation is triggered
      return {
        success: false,
        error: 'FIREWALL_WAF_LOCK_ERROR',
        message: `Firewall API 503: Kernel netfilter sync locked by concurrent telemetry daemon. Could not apply drop rule for IP ${ip}.`,
        suggestedAlternative: 'Apply application-level or API Gateway rate limiting (apply_rate_limit) to choke attack traffic at reverse proxy ingress.'
      };
    }

    this.blockedIps.add(ip);
    return {
      success: true,
      action: 'IP_BLOCKED',
      ip,
      message: `Firewall iptables/WAF drop rule successfully registered for ${ip}. Traffic dropped at perimeter.`,
      activeRuleCount: this.blockedIps.size
    };
  }

  public applyRateLimit(endpoint: string) {
    this.rateLimitedEndpoints.add(endpoint);
    return {
      success: true,
      action: 'RATE_LIMIT_APPLIED',
      endpoint,
      rateLimitPolicy: 'Strict Token Bucket: 10 requests/minute per client IP (burst=5)',
      message: `Successfully applied ingress rate limit to ${endpoint}. Non-compliant flood connections will be rejected with HTTP 429.`,
      estimatedMitigationEffect: '94% reduction in rogue auth worker load'
    };
  }

  public restoreService() {
    this.serviceRestored = true;
    return {
      success: true,
      action: 'SERVICE_RESTORED',
      message: 'Flushed upstream worker socket queues, restarted degraded auth pod replicas, and validated healthy status.',
      clusterStatus: 'OPTIMAL_OPERATION'
    };
  }

  public sendSecurityAlert(message: string) {
    this.alertsSent.push(message);
    return {
      success: true,
      action: 'ALERT_DISPATCHED',
      dispatchChannel: '#sec-ops-war-room (PagerDuty / Slack / SIEM)',
      severity: 'HIGH',
      deliveredAt: new Date().toISOString(),
      message
    };
  }

  public generateIncidentReport(data?: Record<string, any>) {
    return {
      success: true,
      action: 'INCIDENT_REPORT_GENERATED',
      reportId: `IR-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      summary: 'Automated AI incident commander successfully investigated volumetric credential stuffing attack, adapted past firewall lock failures, contained malicious ingress, and restored normal latency.'
    };
  }

  public getFullEvidence(): IncidentEvidence {
    const health = this.getCurrentServerHealth();
    return {
      suspiciousIps: [
        {
          ip: this.primaryAttackerIp,
          requestCount: 2840,
          threatScore: 96,
          country: 'Romania',
          asn: 'AS44123',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mirai-variant/4.1',
          flaggedBehaviors: ['Volumetric HTTP POST flood', 'Credential stuffing', 'High 503 error causation']
        },
        {
          ip: this.secondaryAttackerIp,
          requestCount: 1050,
          threatScore: 78,
          country: 'Bulgaria',
          asn: 'AS44123',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) BotnetCluster/2.0',
          flaggedBehaviors: ['Synchronized brute-force probing']
        }
      ],
      requestMetrics: [
        { timestamp: 'T-10m', endpoint: this.targetedEndpoint, statusCode: 200, requestsPerSec: 45, errorRatePercent: 0.1 },
        { timestamp: 'T-8m', endpoint: this.targetedEndpoint, statusCode: 503, requestsPerSec: 180, errorRatePercent: 12.4 },
        { timestamp: 'T-5m', endpoint: this.targetedEndpoint, statusCode: 503, requestsPerSec: 540, errorRatePercent: 48.2 },
        { timestamp: 'T-2m', endpoint: this.targetedEndpoint, statusCode: this.rateLimitedEndpoints.has(this.targetedEndpoint) ? 429 : 503, requestsPerSec: this.rateLimitedEndpoints.has(this.targetedEndpoint) ? 65 : 520, errorRatePercent: this.rateLimitedEndpoints.has(this.targetedEndpoint) ? 2.1 : 46.8 },
        { timestamp: 'NOW', endpoint: this.targetedEndpoint, statusCode: 200, requestsPerSec: this.rateLimitedEndpoints.has(this.targetedEndpoint) ? 28 : 510, errorRatePercent: health.errorRate }
      ],
      threatScore: this.rateLimitedEndpoints.has(this.targetedEndpoint) || this.blockedIps.has(this.primaryAttackerIp) ? 18 : 94,
      affectedEndpoint: this.targetedEndpoint,
      serverHealth: health,
      collectedEvidence: [
        'Ingress traffic burst of 540 req/sec focused on auth login endpoint',
        `Primary attacker IP identified as ${this.primaryAttackerIp} (AS44123)`,
        'Upstream auth workers experiencing 46.8% error rate and 1680ms latency',
        ...(this.rateLimitedEndpoints.has(this.targetedEndpoint) ? ['Mitigated via Ingress Layer-7 rate limiting: 10 req/min token bucket'] : []),
        ...(this.serviceRestored ? ['Service fully verified and restored: Latency normalized to 42ms'] : [])
      ],
      blockedIps: Array.from(this.blockedIps),
      rateLimitedEndpoints: Array.from(this.rateLimitedEndpoints),
      serviceRestored: this.serviceRestored
    };
  }
}
