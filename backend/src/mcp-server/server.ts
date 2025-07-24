// backend/src/mcp-server/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { DockerService } from '../services/dockerService';
import { EmbeddingService } from '../services/embeddingService';
import { QueueService } from '../services/queueService';
import { VectorDBService } from '../services/vectorDBService';
import { tools as toolDefinitions } from './tools/tools';
import {
  IntentType,
  AttackType,
  WorkflowContext,
  TestJob,
  MCPToolCall,
  MCPToolResponse,
  ValidationError,
  TestPriority,
  ViableAttacks,
  TrustService,
} from '@shared/types';
import { validateToolCall } from '../layers/validation';
import { mapAttackToCommand } from '../layers/translation';

export class MCPServer {
  private server: Server;
  private dockerClient: DockerService;
  private embeddingService: EmbeddingService;
  private queueService: QueueService;
  private vectorDB: VectorDBService;
  private vulnerabilityMappings: Map<AttackType, any>;

  constructor() {
    this.server = new Server(
      {
        name: 'soc2-testing-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.dockerClient = new DockerService();
    this.embeddingService = new EmbeddingService();
    this.queueService = new QueueService();
    this.vectorDB = new VectorDBService();
    this.vulnerabilityMappings = new Map();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.values(toolDefinitions),
    }));

    // Handle tool execution request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolCall: MCPToolCall = {
          name: request.params.name,
          arguments: request.params.arguments || {},
        };

        // Validate the tool call
        await validateToolCall(toolCall);

        // Execute the tool
        const result = await this.handleToolCall(toolCall);

        return result;
      } catch (error) {
        logger.error('Tool execution failed:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleToolCall(toolCall: MCPToolCall): Promise<MCPToolResponse> {
    const { name, arguments: args } = toolCall;

    switch (name) {
      case 'scan_ports':
        return this.executeScanPorts(args);
      case 'test_vulnerability':
        return this.executeVulnerabilityTest(args);
      case 'check_ssl':
        return this.executeSSLCheck(args);
      case 'test_authentication':
        return this.executeAuthTest(args);
      case 'analyze_headers':
        return this.executeHeaderAnalysis(args);
                default:
        throw new ValidationError(`Unknown tool: ${name}`);
    }
  }

  private async executeScanPorts(args: any): Promise<MCPToolResponse> {
    const command = await mapAttackToCommand(AttackType.PORT_SCANNING, args);
    const result = await this.dockerClient.runTool({
      image: config.KALI_IMAGE,
      command: command.split(' '),
      timeout: 60000,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.stdout,
        },
      ],
    };
  }

  private async executeVulnerabilityTest(args: any): Promise<MCPToolResponse> {
    const { attack_type, target } = args;
    const command = await mapAttackToCommand(attack_type, { target });
    
    const result = await this.dockerClient.runTool({
      image: config.KALI_IMAGE,
      command: command.split(' '),
      timeout: config.TEST_TIMEOUT_MS,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.stdout,
        },
        {
          type: 'resource',
          data: {
            exitCode: result.exitCode,
            duration: result.duration,
            stderr: result.stderr,
          },
        },
      ],
    };
  }

  private async executeSSLCheck(args: any): Promise<MCPToolResponse> {
    const command = await mapAttackToCommand(AttackType.SSL_VULNERABILITIES, args);
    const result = await this.dockerClient.runTool({
      image: config.KALI_IMAGE,
      command: command.split(' '),
      timeout: 120000,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.stdout,
        },
      ],
    };
  }

  private async executeAuthTest(args: any): Promise<MCPToolResponse> {
    const command = await mapAttackToCommand(AttackType.AUTHENTICATION_BYPASS, args);
    const result = await this.dockerClient.runTool({
      image: config.KALI_IMAGE,
      command: command.split(' '),
      timeout: config.TEST_TIMEOUT_MS,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.stdout,
        },
      ],
    };
  }

  private async executeHeaderAnalysis(args: any): Promise<MCPToolResponse> {
    const command = await mapAttackToCommand(AttackType.CLICKJACKING, args);
    const result = await this.dockerClient.runTool({
      image: config.KALI_IMAGE,
      command: command.split(' '),
      timeout: 30000,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.stdout,
        },
      ],
    };
  }

  // Methods for workflow orchestration (called by API layer)
  async classifyIntent(userInput: string): Promise<any> {
    const embedding = await this.embeddingService.getEmbedding(userInput);
    
    // Compare against known intent patterns
    const intentPatterns = {
      [IntentType.SECURITY_TEST]: 'security vulnerability penetration test assessment',
      [IntentType.AVAILABILITY_TEST]: 'availability uptime performance load stress',
      [IntentType.CONFIDENTIALITY_TEST]: 'confidential data leakage exposure privacy',
      [IntentType.INTEGRITY_TEST]: 'data integrity validation accuracy consistency',
      [IntentType.PRIVACY_TEST]: 'privacy gdpr ccpa personal information',
    };

    let bestIntent = IntentType.UNKNOWN;
    let bestScore = 0;

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      const patternEmbedding = await this.embeddingService.getEmbedding(pattern);
      const similarity = await this.embeddingService.findSimilar(embedding, [
        { text: pattern, embedding: patternEmbedding },
      ]);

      if (similarity.length > 0 && similarity[0].similarity > bestScore) {
        bestScore = similarity[0].similarity;
        bestIntent = intent as IntentType;
      }
    }

    return {
      primary_intent: bestIntent,
      confidence: bestScore,
      user_input: userInput,
    };
  }

  async enrichContext(intent: any, formData: any): Promise<WorkflowContext> {
    // Get historical context from vector DB
    const embedding = await this.embeddingService.getEmbedding(intent.user_input);
    const historical = await this.vectorDB.search(embedding, { type: 'test_result' }, 5);

    // Correlate attacks based on intent
    const viableAttacks = await this.correlateAttacks(intent.primary_intent);

    // Match user description to specific attacks if provided
    let matchedAttacks: AttackType[] = [];
    if (formData.info_description) {
      const matches = await this.embeddingService.matchInfoToAttack(
        formData.info_description,
        Object.values(AttackType)
      );
      matchedAttacks = matches.map((m: any) => m.attack);
    }

    // Categorize attacks by priority
    const categorizedAttacks = this.categorizeViableAttacks([
      ...viableAttacks,
      ...matchedAttacks,
    ]);

    return {
      intent: intent.primary_intent,
      trust_areas: this.mapIntentToTrustAreas(intent.primary_intent),
      controls: [],
      user_input: intent.user_input,
      form_data: formData,
      risk_level: this.assessRiskLevel(categorizedAttacks),
      requires_approval: this.requiresApproval(categorizedAttacks),
      viable_attacks: categorizedAttacks,
      embeddings: {
        input_embedding: embedding,
        correlated_attacks: viableAttacks.map(attack => ({
          attack,
          similarity: 0.8, // Placeholder
        })),
      },
    };
  }

  async runWorkflow(context: WorkflowContext): Promise<any> {
    // Create test jobs from viable attacks
    const jobs: TestJob[] = [];

    for (const attack of context.viable_attacks.critical) {
      jobs.push({
        attack_type: attack,
        target: context.form_data,
        priority: TestPriority.CRITICAL,
        viable_attacks: context.viable_attacks,
        context,
      });
    }

    for (const attack of context.viable_attacks.standard) {
      jobs.push({
        attack_type: attack,
        target: context.form_data,
        priority: TestPriority.STANDARD,
        viable_attacks: context.viable_attacks,
        context,
      });
    }

    for (const attack of context.viable_attacks.lowPriority) {
      jobs.push({
        attack_type: attack,
        target: context.form_data,
        priority: TestPriority.LOW,
        viable_attacks: context.viable_attacks,
        context,
      });
    }

    // Enqueue jobs
    const jobIds = await this.queueService.enqueueBatch(jobs);

    return {
      workflow_id: `wf_${Date.now()}`,
      status: context.requires_approval ? 'pending_approval' : 'running',
      jobs,
      job_ids: jobIds,
      estimated_completion: new Date(Date.now() + 3600000), // 1 hour estimate
      estimated_cost: this.estimateCost(jobs),
    };
  }

  private async correlateAttacks(intent: IntentType): Promise<AttackType[]> {
    // Map intents to relevant attacks
    const intentAttackMap: Record<IntentType, AttackType[]> = {
      [IntentType.SECURITY_TEST]: [
        AttackType.SQL_INJECTION,
        AttackType.XSS,
        AttackType.CSRF,
        AttackType.AUTHENTICATION_BYPASS,
        AttackType.PRIVILEGE_ESCALATION,
      ],
      [IntentType.AVAILABILITY_TEST]: [
        AttackType.DOS_ATTACKS,
        AttackType.PORT_SCANNING,
      ],
      [IntentType.CONFIDENTIALITY_TEST]: [
        AttackType.DATA_EXFILTRATION,
        AttackType.IDOR,
        AttackType.DIRECTORY_TRAVERSAL,
      ],
      [IntentType.INTEGRITY_TEST]: [
        AttackType.SQL_INJECTION,
        AttackType.COMMAND_INJECTION,
        AttackType.FILE_UPLOAD,
      ],
      [IntentType.PRIVACY_TEST]: [
        AttackType.IDOR,
        AttackType.DATA_EXFILTRATION,
        AttackType.SESSION_MANAGEMENT,
      ],
      [IntentType.UNKNOWN]: [
        AttackType.VULNERABILITY_SCANNING,
        AttackType.PORT_SCANNING,
      ],
    };

    return intentAttackMap[intent] || [];
  }

  private categorizeViableAttacks(attacks: AttackType[]): ViableAttacks {
    const criticalAttacks = [
      AttackType.SQL_INJECTION,
      AttackType.COMMAND_INJECTION,
      AttackType.AUTHENTICATION_BYPASS,
      AttackType.PRIVILEGE_ESCALATION,
    ];

    const lowPriorityAttacks = [
      AttackType.PORT_SCANNING,
      AttackType.SSL_VULNERABILITIES,
    ];

    return {
      critical: attacks.filter(a => criticalAttacks.includes(a)),
      standard: attacks.filter(
        a => !criticalAttacks.includes(a) && !lowPriorityAttacks.includes(a)
      ),
      lowPriority: attacks.filter(a => lowPriorityAttacks.includes(a)),
    };
  }

  private mapIntentToTrustAreas(intent: IntentType): TrustService[] {
    const mapping = {
      [IntentType.SECURITY_TEST]: [TrustService.SECURITY],
      [IntentType.AVAILABILITY_TEST]: [TrustService.AVAILABILITY],
      [IntentType.CONFIDENTIALITY_TEST]: [TrustService.CONFIDENTIALITY],
      [IntentType.INTEGRITY_TEST]: [TrustService.PROCESSING_INTEGRITY],
      [IntentType.PRIVACY_TEST]: [TrustService.PRIVACY],
      [IntentType.UNKNOWN]: [TrustService.SECURITY],
    };

    return mapping[intent] || [TrustService.SECURITY];
  }

  private assessRiskLevel(attacks: ViableAttacks): 'high' | 'medium' | 'low' {
    if (attacks.critical.length > 0) return 'high';
    if (attacks.standard.length > 3) return 'medium';
    return 'low';
  }

  private requiresApproval(attacks: ViableAttacks): boolean {
    return attacks.critical.length > 0;
  }

  private estimateCost(jobs: TestJob[]): number {
    const costPerJob = {
      critical: 0.50,
      standard: 0.20,
      low: 0.10,
    };

    return jobs.reduce((total, job) => {
      return total + (costPerJob[job.priority] || 0.20);
    }, 0);
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started');
  }
}

// Export for use by API layer
export default MCPServer;

// If running directly, start the server
if (require.main === module) {
  const server = new MCPServer();
  server.start().catch((error) => {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
