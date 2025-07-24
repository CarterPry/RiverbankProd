// backend/src/middleware/apiKeyAuth.ts
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  permissions: string[];
  rate_limit: number;
  created_at: Date;
  last_used: Date;
  is_active: boolean;
}

// In production, this would be stored in database
const API_KEYS = new Map<string, ApiKey>([
  ['test_', {
    id: 'key_test_001',
    key_hash: hashApiKey('sk-test-1234567890abcdefghijklmnopqrstuvwxyz'),
    name: 'Test API Key',
    permissions: ['workflows:create', 'workflows:read', 'tools:execute'],
    rate_limit: 100,
    created_at: new Date(),
    last_used: new Date(),
    is_active: true
  }],
  ['prod_', {
    id: 'key_prod_001',
    key_hash: hashApiKey('sk-prod-abcdefghijklmnopqrstuvwxyz1234567890'),
    name: 'Production API Key',
    permissions: ['*'],
    rate_limit: 1000,
    created_at: new Date(),
    last_used: new Date(),
    is_active: true
  }]
]);

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export interface ApiKeyAuthRequest extends Request {
  apiKey?: ApiKey;
  user?: any;
}

export function apiKeyAuth(requiredPermissions: string[] = []) {
  return async (req: ApiKeyAuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check for API key in headers
      const apiKeyHeader = req.headers['x-api-key'] as string;
      const bearerToken = req.headers.authorization;

      // Prefer bearer token (JWT) over API key
      if (bearerToken && bearerToken.startsWith('Bearer ')) {
        // Let JWT middleware handle this
        return next();
      }

      if (!apiKeyHeader) {
        return res.status(401).json({
          error: 'Missing API key',
          message: 'Please provide an API key via X-API-Key header'
        });
      }

      // Extract key prefix
      const keyPrefix = apiKeyHeader.substring(0, 5);
      const apiKeyData = API_KEYS.get(keyPrefix);

      if (!apiKeyData) {
        logger.warn('Invalid API key attempt', { keyPrefix });
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid'
        });
      }

      // Verify the full key
      const keyHash = hashApiKey(apiKeyHeader);
      if (keyHash !== apiKeyData.key_hash) {
        logger.warn('API key hash mismatch', { keyPrefix });
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid'
        });
      }

      // Check if key is active
      if (!apiKeyData.is_active) {
        return res.status(401).json({
          error: 'API key disabled',
          message: 'This API key has been disabled'
        });
      }

      // Check permissions
      const hasWildcard = apiKeyData.permissions.includes('*');
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        hasWildcard || apiKeyData.permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        logger.warn('Insufficient API key permissions', {
          keyId: apiKeyData.id,
          required: requiredPermissions,
          actual: apiKeyData.permissions
        });
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'This API key does not have the required permissions',
          required_permissions: requiredPermissions
        });
      }

      // Update last used
      apiKeyData.last_used = new Date();

      // Attach API key data to request
      req.apiKey = apiKeyData;
      req.user = {
        id: apiKeyData.id,
        name: apiKeyData.name,
        type: 'api_key'
      };

      logger.info('API key authenticated', {
        keyId: apiKeyData.id,
        name: apiKeyData.name
      });

      next();
    } catch (error) {
      logger.error('API key auth error', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  };
}

// Helper to generate new API keys
export function generateApiKey(prefix: 'test' | 'prod' = 'test'): string {
  const randomBytes = require('crypto').randomBytes(32).toString('hex');
  return `sk-${prefix}-${randomBytes}`;
}

// Example usage in routes:
// router.post('/api/workflows', apiKeyAuth(['workflows:create']), createWorkflow); 