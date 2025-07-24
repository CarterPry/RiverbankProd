// backend/src/config/environments/production.ts
import { Config } from '../index';

export const production: Partial<Config> = {
  // Server
  PORT: 3000,
  
  // Queue System - Production limits
  MAX_CONCURRENT_TESTS: 8,
  TEST_TIMEOUT_MS: 900000, // 15 minutes
  
  // Security - Most restrictive
  API_RATE_LIMIT: 30,
  
  // Monitoring - Full monitoring
  PROMETHEUS_ENABLED: true,
  JAEGER_ENABLED: true,
  
  // Cost Tracking
  ENABLE_COST_TRACKING: true,
  
  // Evidence Storage - Use S3 in production
  EVIDENCE_STORAGE_TYPE: 's3' as const,
}; 