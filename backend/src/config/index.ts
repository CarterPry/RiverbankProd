// backend/src/config/index.ts
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Environment enum
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

// Configuration schema with Zod validation
const configSchema = z.object({
  // Environment
  NODE_ENV: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  
  // Server
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  PG_CONNECTION_STRING: z.string().url().or(z.string().startsWith('postgres://')),
  
  // Embeddings
  EMBEDDING_PROVIDER: z.enum(['ollama', 'openai', 'local']).default('ollama'),
  EMBEDDING_API_URL: z.string().url().default('http://localhost:11434/api/embeddings'),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  EMBEDDING_DIMENSIONS: z.string().default('384').transform(Number),
  
  // Docker/Kali
  DOCKER_HOST: z.string().optional(),
  KALI_IMAGE: z.string().default('kalilinux/kali-rolling'),
  DOCKER_NETWORK: z.string().default('soc2-testing-network'),
  
  // Queue System
  BULLMQ_REDIS_URL: z.string().default('redis://localhost:6379'),
  MAX_CONCURRENT_TESTS: z.string().default('4').transform(Number),
  TEST_TIMEOUT_MS: z.string().default('300000').transform(Number), // 5 minutes
  
  // HITL (Human in the Loop)
  SLACK_ENABLED: z.string().default('false').transform(val => val === 'true'),
  SLACK_TOKEN: z.string().optional(),
  SLACK_CHANNEL: z.string().default('#soc2-approvals'),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  
  // Evidence Export
  VANTA_ENABLED: z.string().default('false').transform(val => val === 'true'),
  VANTA_API_KEY: z.string().optional(),
  VANTA_API_URL: z.string().url().default('https://api.vanta.com'),
  
  DRATA_ENABLED: z.string().default('false').transform(val => val === 'true'),
  DRATA_API_KEY: z.string().optional(),
  DRATA_API_URL: z.string().url().default('https://api.drata.com'),
  
  // Storage
  EVIDENCE_STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  EVIDENCE_STORAGE_PATH: z.string().default('./evidence'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().min(32),
  API_RATE_LIMIT: z.string().default('100').transform(Number),
  
  // AI/LLM (optional)
  AI_PROVIDER: z.enum(['anthropic', 'openai', 'none']).default('none'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Monitoring
  PROMETHEUS_ENABLED: z.string().default('true').transform(val => val === 'true'),
  JAEGER_ENABLED: z.string().default('false').transform(val => val === 'true'),
  JAEGER_ENDPOINT: z.string().url().optional(),
  
  // Cost Tracking
  ENABLE_COST_TRACKING: z.string().default('true').transform(val => val === 'true'),
  COST_PER_CONTAINER_MINUTE: z.string().default('0.01').transform(Number),
  COST_PER_API_CALL: z.string().default('0.0001').transform(Number),
});

// Export the config type
export type Config = z.infer<typeof configSchema>;

// Parse and validate configuration
let config: Config;
try {
  config = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Configuration validation failed:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Environment-specific overrides
import { development } from './environments/development';
import { staging } from './environments/staging';
import { production } from './environments/production';

const environmentConfigs = {
  [Environment.DEVELOPMENT]: development,
  [Environment.STAGING]: staging,
  [Environment.PRODUCTION]: production,
  [Environment.TEST]: {} // No overrides for test
};

// Merge environment-specific config
const envOverrides = environmentConfigs[config.NODE_ENV] || {};
config = { ...config, ...envOverrides };

// Validate required services based on enabled features
if (config.SLACK_ENABLED && !config.SLACK_TOKEN) {
  throw new Error('SLACK_TOKEN is required when SLACK_ENABLED is true');
}

if (config.VANTA_ENABLED && !config.VANTA_API_KEY) {
  throw new Error('VANTA_API_KEY is required when VANTA_ENABLED is true');
}

if (config.EVIDENCE_STORAGE_TYPE === 's3' && !config.AWS_S3_BUCKET) {
  throw new Error('AWS_S3_BUCKET is required when EVIDENCE_STORAGE_TYPE is s3');
}

// Export the validated configuration
export { config };

// Helper functions
export const isDevelopment = () => config.NODE_ENV === Environment.DEVELOPMENT;
export const isProduction = () => config.NODE_ENV === Environment.PRODUCTION;
export const isTest = () => config.NODE_ENV === Environment.TEST;

// Log configuration in development (excluding secrets)
if (isDevelopment()) {
  const safeConfig = { ...config };
  const secretKeys = ['JWT_SECRET', 'SLACK_TOKEN', 'VANTA_API_KEY', 'DRATA_API_KEY', 
                      'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PG_CONNECTION_STRING'];
  
  secretKeys.forEach(key => {
    if (safeConfig[key as keyof Config]) {
      (safeConfig as any)[key] = '[REDACTED]';
    }
  });
  
  console.log('🔧 Configuration loaded:', JSON.stringify(safeConfig, null, 2));
  secretKeys.forEa
}