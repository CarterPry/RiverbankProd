// backend/src/services/dockerService.ts
import Docker from 'dockerode';
import { Readable } from 'stream';
import { config } from '../config';
import { logger } from '../utils/logger';
import { timeout } from '../utils/asyncHelpers';
import { AttackType, TestResult } from '@shared/types';

export interface DockerCommand {
  image: string;
  command: string[];
  environment?: Record<string, string>;
  volumes?: Record<string, string>;
  network?: string;
  workingDir?: string;
  timeout?: number;
}

export class DockerService {
  private docker: Docker;
  private readonly defaultTimeout = config.TEST_TIMEOUT_MS;

  constructor() {
    this.docker = new Docker({
      socketPath: config.DOCKER_HOST || '/var/run/docker.sock',
    });
  }

  async runTool(params: DockerCommand): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
  }> {
    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      // Create container
      const createOptions: Docker.ContainerCreateOptions = {
        Image: params.image,
        Cmd: params.command,
        Env: Object.entries(params.environment || {}).map(([k, v]) => `${k}=${v}`),
        WorkingDir: params.workingDir || '/workspace',
        HostConfig: {
          AutoRemove: false, // We'll remove manually after collecting logs
          NetworkMode: params.network || config.DOCKER_NETWORK,
          Binds: Object.entries(params.volumes || {}).map(([src, dest]) => `${src}:${dest}`),
          Memory: 2 * 1024 * 1024 * 1024, // 2GB limit
          CpuQuota: 100000, // Limit CPU usage
          ReadonlyRootfs: true, // Security: read-only root
          SecurityOpt: ['no-new-privileges'],
        },
        AttachStdout: true,
        AttachStderr: true,
      };

      container = await this.docker.createContainer(createOptions);
      
      // Attach to streams before starting
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      // Collect output
      let stdout = '';
      let stderr = '';
      
      stream.on('data', (chunk: Buffer) => {
        const str = chunk.toString('utf8');
        // Docker multiplexes stdout/stderr - first byte indicates stream
        if (chunk[0] === 1) {
          stdout += str.slice(8); // Skip header
        } else if (chunk[0] === 2) {
          stderr += str.slice(8);
        }
      });

      // Start container
      await container.start();

      // Wait for completion with timeout
      const waitPromise = container.wait();
      const result = await timeout(
        waitPromise,
        params.timeout || this.defaultTimeout,
        `Container execution timed out after ${params.timeout || this.defaultTimeout}ms`
      );

      const duration = Date.now() - startTime;

      return {
        stdout,
        stderr,
        exitCode: result.StatusCode,
        duration,
      };
    } catch (error) {
      logger.error('Docker execution failed:', error);
      throw error;
    } finally {
      // Cleanup
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (cleanupError) {
          logger.error('Failed to remove container:', cleanupError);
        }
      }
    }
  }

  async runParallelTools(
    commands: DockerCommand[]
  ): Promise<Array<{ command: DockerCommand; result: any; error?: Error }>> {
    return Promise.all(
      commands.map(async (command) => {
        try {
          const result = await this.runTool(command);
          return { command, result };
        } catch (error) {
          return { command, result: null, error: error as Error };
        }
      })
    );
  }

  async pullImage(imageName: string): Promise<void> {
    logger.info(`Pulling Docker image: ${imageName}`);
    
    const stream = await this.docker.pull(imageName);
    
    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async imageExists(imageName: string): Promise<boolean> {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
      return true;
    } catch {
      return false;
    }
  }

  async createIsolatedNetwork(name: string): Promise<Docker.Network> {
    return this.docker.createNetwork({
      Name: name,
      Driver: 'bridge',
      Internal: true, // No external access
      Labels: {
        'soc2.testing': 'true',
        'soc2.isolated': 'true',
      },
    });
  }

  async cleanupNetworks(): Promise<void> {
    const networks = await this.docker.listNetworks({
      filters: { label: ['soc2.testing=true'] },
    });

    for (const network of networks) {
      try {
        const net = this.docker.getNetwork(network.Id);
        await net.remove();
      } catch (error) {
        logger.error(`Failed to remove network ${network.Name}:`, error);
      }
    }
  }
}

// backend/src/services/embeddingService.ts
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import { cosineSimilarity } from '../utils/cosineSimilarity';
import { AttackType, VulnerabilityMapping } from '@shared/types';

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
}

export class EmbeddingService {
  private readonly apiUrl: string;
  private readonly model: string;
  private embeddingCache = new Map<string, number[]>();

  constructor() {
    this.apiUrl = config.EMBEDDING_API_URL;
    this.model = config.EMBEDDING_MODEL;
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached;
    }

    try {
      const embedding = await retry(
        async () => {
          if (config.EMBEDDING_PROVIDER === 'ollama') {
            return this.getOllamaEmbedding(text);
          } else if (config.EMBEDDING_PROVIDER === 'openai') {
            return this.getOpenAIEmbedding(text);
          } else {
            throw new Error(`Unsupported embedding provider: ${config.EMBEDDING_PROVIDER}`);
          }
        },
        {
          maxAttempts: 3,
          delay: 1000,
          onRetry: (error, attempt) => {
            logger.warn(`Embedding request failed (attempt ${attempt}):`, error.message);
          },
        }
      );

      // Cache the result
      this.embeddingCache.set(text, embedding);
      
      return embedding;
    } catch (error) {
      logger.error('Failed to get embedding:', error);
      throw error;
    }
  }

  private async getOllamaEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
      `${this.apiUrl}/embeddings`,
      {
        model: this.model,
        prompt: text,
      },
      {
        timeout: 30000,
      }
    );

    return response.data.embedding;
  }

  private async getOpenAIEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${config.EMBEDDING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.data[0].embedding;
  }

  async findSimilar(
    queryEmbedding: number[],
    candidates: Array<{ text: string; embedding: number[]; metadata?: any }>,
    threshold = 0.7
  ): Promise<Array<{ text: string; similarity: number; metadata?: any }>> {
    const results = candidates
      .map((candidate) => ({
        text: candidate.text,
        similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
        metadata: candidate.metadata,
      }))
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  }

  async correlateAttacks(
    attackType: AttackType,
    mappings: VulnerabilityMapping[]
  ): Promise<Array<{ attack: AttackType; similarity: number }>> {
    const attackText = `${attackType} attack vulnerability security`;
    const attackEmbedding = await this.getEmbedding(attackText);

    const correlations = await Promise.all(
      mappings.map(async (mapping) => {
        const mappingText = `${mapping.attack} ${mapping.description} ${mapping.tsc.join(' ')}`;
        const mappingEmbedding = await this.getEmbedding(mappingText);
        
        return {
          attack: mapping.attack,
          similarity: cosineSimilarity(attackEmbedding, mappingEmbedding),
        };
      })
    );

    return correlations.sort((a, b) => b.similarity - a.similarity);
  }

  async matchInfoToAttack(
    infoDescription: string,
    attackTypes: AttackType[]
  ): Promise<Array<{ attack: AttackType; confidence: number }>> {
    const infoEmbedding = await this.getEmbedding(infoDescription);

    const matches = await Promise.all(
      attackTypes.map(async (attack) => {
        const attackDescription = this.getAttackDescription(attack);
        const attackEmbedding = await this.getEmbedding(attackDescription);
        
        return {
          attack,
          confidence: cosineSimilarity(infoEmbedding, attackEmbedding),
        };
      })
    );

    return matches
      .filter((m) => m.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private getAttackDescription(attack: AttackType): string {
    const descriptions: Record<AttackType, string> = {
      [AttackType.SQL_INJECTION]: 'SQL injection database query manipulation vulnerability',
      [AttackType.XSS]: 'Cross-site scripting JavaScript injection vulnerability',
      [AttackType.CSRF]: 'Cross-site request forgery attack vulnerability',
      [AttackType.IDOR]: 'Insecure direct object reference access control vulnerability',
      [AttackType.CLICKJACKING]: 'Clickjacking UI redress attack iframe vulnerability',
      // ... add more descriptions
    };

    return descriptions[attack] || attack;
  }
}

// backend/src/services/queueService.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { TestJob } from '@shared/types';

export class QueueService {
  private testQueue: Queue<TestJob>;
  private queueEvents: QueueEvents;

  constructor() {
    const connection = {
      host: new URL(config.BULLMQ_REDIS_URL).hostname,
      port: parseInt(new URL(config.BULLMQ_REDIS_URL).port || '6379'),
    };

    this.testQueue = new Queue('soc2-tests', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    this.queueEvents = new QueueEvents('soc2-tests', { connection });
  }

  async enqueueTest(job: TestJob): Promise<string> {
    const queuedJob = await this.testQueue.add(job.attack_type, job, {
      priority: this.getPriorityValue(job.priority),
      delay: job.priority === 'low' ? this.getOffHoursDelay() : 0,
    });

    logger.info(`Enqueued test job ${queuedJob.id} for ${job.attack_type}`);
    return queuedJob.id!;
  }

  async enqueueBatch(jobs: TestJob[]): Promise<string[]> {
    const bulkJobs = jobs.map((job) => ({
      name: job.attack_type,
      data: job,
      opts: {
        priority: this.getPriorityValue(job.priority),
        delay: job.priority === 'low' ? this.getOffHoursDelay() : 0,
      },
    }));

    const queuedJobs = await this.testQueue.addBulk(bulkJobs);
    return queuedJobs.map((j) => j.id!);
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.testQueue.getWaitingCount(),
      this.testQueue.getActiveCount(),
      this.testQueue.getCompletedCount(),
      this.testQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical':
        return 1;
      case 'standard':
        return 5;
      case 'low':
        return 10;
      default:
        return 5;
    }
  }

  private getOffHoursDelay(): number {
    const now = new Date();
    const hour = now.getHours();
    
    // If already in off-hours (e.g., 8 PM - 6 AM), no delay
    if (hour >= 20 || hour < 6) {
      return 0;
    }
    
    // Calculate delay until 8 PM
    const eightPM = new Date(now);
    eightPM.setHours(20, 0, 0, 0);
    
    if (eightPM < now) {
      // If past 8 PM today, schedule for tomorrow
      eightPM.setDate(eightPM.getDate() + 1);
    }
    
    return eightPM.getTime() - now.getTime();
  }
}