// backend/src/layers/validation.ts
import { z } from 'zod';
import { MCPToolCall, ValidationError } from '@shared/types';
import { logger } from '../utils/logger';

// Tool call validation schemas
const toolCallSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.any()),
});

const scanPortsSchema = z.object({
  target: z.string(),
  ports: z.string().optional(),
  flags: z.array(z.string()).optional(),
});

const vulnerabilityTestSchema = z.object({
  attack_type: z.string(),
  target: z.string(),
  options: z.record(z.any()).optional(),
});

const sslCheckSchema = z.object({
  target: z.string(),
  port: z.number().default(443),
  protocols: z.array(z.string()).optional(),
});

const authTestSchema = z.object({
  target: z.string(),
  username: z.string().optional(),
  wordlist: z.string().optional(),
});

const headerAnalysisSchema = z.object({
  target: z.string(),
  headers: z.array(z.string()).optional(),
});

// Tool-specific validators
const toolValidators: Record<string, z.ZodSchema> = {
  scan_ports: scanPortsSchema,
  test_vulnerability: vulnerabilityTestSchema,
  check_ssl: sslCheckSchema,
  test_authentication: authTestSchema,
  analyze_headers: headerAnalysisSchema,
};

export async function validateToolCall(toolCall: MCPToolCall): Promise<void> {
  try {
    // Validate basic structure
    toolCallSchema.parse(toolCall);

    // Get tool-specific validator
    const validator = toolValidators[toolCall.name];
    if (!validator) {
      throw new ValidationError(`Unknown tool: ${toolCall.name}`);
    }

    // Validate tool arguments
    validator.parse(toolCall.arguments);

    // Additional business logic validation
    await validateBusinessRules(toolCall);

    logger.debug('Tool call validated', { tool: toolCall.name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid tool call parameters', details);
    }
    throw error;
  }
}

async function validateBusinessRules(toolCall: MCPToolCall): Promise<void> {
  const { name, arguments: args } = toolCall;

  // Validate target format
  if ('target' in args) {
    const target = args.target as string;
    
    // Check if it's a valid domain or IP
    if (!isValidDomain(target) && !isValidIP(target)) {
      throw new ValidationError('Invalid target: must be a valid domain or IP address');
    }

    // Check if target is in allowed list (if configured)
    if (process.env.ALLOWED_TARGETS) {
      const allowedTargets = process.env.ALLOWED_TARGETS.split(',');
      if (!allowedTargets.some(allowed => target.includes(allowed))) {
        throw new ValidationError('Target not in allowed list');
      }
    }
  }

  // Tool-specific business rules
  switch (name) {
    case 'scan_ports':
      if (args.ports) {
        validatePortRange(args.ports as string);
      }
      break;

    case 'test_vulnerability':
      validateAttackType(args.attack_type as string);
      break;

    case 'check_ssl':
      if (args.port) {
        const port = args.port as number;
        if (port < 1 || port > 65535) {
          throw new ValidationError('Invalid port number');
        }
      }
      break;
  }
}

export function validateDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(domain);
}

export function validateIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function isValidDomain(domain: string): boolean {
  return validateDomain(domain);
}

function isValidIP(ip: string): boolean {
  return validateIP(ip);
}

function validatePortRange(ports: string): void {
  // Validate port range format (e.g., "80,443,8080-8090")
  const portPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
  if (!portPattern.test(ports)) {
    throw new ValidationError('Invalid port range format');
  }

  // Parse and validate individual ports
  const portList = ports.split(',');
  for (const portSpec of portList) {
    if (portSpec.includes('-')) {
      const [start, end] = portSpec.split('-').map(Number);
      if (start < 1 || start > 65535 || end < 1 || end > 65535 || start > end) {
        throw new ValidationError(`Invalid port range: ${portSpec}`);
      }
    } else {
      const port = Number(portSpec);
      if (port < 1 || port > 65535) {
        throw new ValidationError(`Invalid port number: ${port}`);
      }
    }
  }
}

function validateAttackType(attackType: string): void {
  const validAttackTypes = [
    'sql_injection',
    'xss',
    'csrf',
    'clickjacking',
    'authentication_bypass',
    'port_scanning',
    'ssl_vulnerabilities',
    // Add more as needed
  ];

  if (!validAttackTypes.includes(attackType)) {
    throw new ValidationError(`Invalid attack type: ${attackType}`);
  }
} 