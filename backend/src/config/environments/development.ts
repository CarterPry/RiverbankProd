// backend/src/config/environments/development.ts
import { Config } from '../index';

export const development: Partial<Config> = {
  MAX_CONCURRENT_TESTS: 2, // Lower for dev machines
  TEST_TIMEOUT_MS: 60000, // 1 minute for faster dev iteration
  API_RATE_LIMIT: 1000, // Higher for testing
  PROMETHEUS_ENABLED: false, // Reduce overhead in dev
  ENABLE_COST_TRACKING: false, // Not needed in dev
};

// backend/src/config/environments/staging.ts
export const staging: Partial<Config> = {
  MAX_CONCURRENT_TESTS: 4,
  TEST_TIMEOUT_MS: 180000, // 3 minutes
  API_RATE_LIMIT: 500,
  PROMETHEUS_ENABLED: true,
  JAEGER_ENABLED: true,
};

// backend/src/config/environments/production.ts
export const production: Partial<Config> = {
  MAX_CONCURRENT_TESTS: 8,
  TEST_TIMEOUT_MS: 300000, // 5 minutes
  API_RATE_LIMIT: 100,
  PROMETHEUS_ENABLED: true,
  JAEGER_ENABLED: true,
  ENABLE_COST_TRACKING: true,
  // Force secure settings in production
  SLACK_ENABLED: true,
  EVIDENCE_STORAGE_TYPE: 's3' as const,
};