// backend/src/config/environments/staging.ts
import { Config } from '../index';

export const staging: Partial<Config> = {
  // Server
  PORT: 3000,
  
  // Queue System - Higher limits for staging
  MAX_CONCURRENT_TESTS: 6,
  TEST_TIMEOUT_MS: 600000, // 10 minutes
  
  // Security - More restrictive
  API_RATE_LIMIT: 50,
  
  // Monitoring - Enable more features
  JAEGER_ENABLED: true,
  
  // Cost Tracking
  ENABLE_COST_TRACKING: true,
}; 