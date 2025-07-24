// shared/types/index.ts

// Enums
export enum IntentType {
  SECURITY_TEST = 'security_test',
  AVAILABILITY_TEST = 'availability_test',
  CONFIDENTIALITY_TEST = 'confidentiality_test',
  INTEGRITY_TEST = 'integrity_test',
  PRIVACY_TEST = 'privacy_test',
  UNKNOWN = 'unknown'
}

export enum AttackType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  IDOR = 'idor',
  CLICKJACKING = 'clickjacking',
  AUTHENTICATION_BYPASS = 'authentication_bypass',
  SESSION_MANAGEMENT = 'session_management',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  DOS_ATTACKS = 'dos_attacks',
  PORT_SCANNING = 'port_scanning',
  VULNERABILITY_SCANNING = 'vulnerability_scanning',
  SSL_VULNERABILITIES = 'ssl_vulnerabilities',
  DIRECTORY_TRAVERSAL = 'directory_traversal',
  FILE_UPLOAD = 'file_upload',
  XXE = 'xxe',
  SSRF = 'ssrf',
  LDAP_INJECTION = 'ldap_injection',
  COMMAND_INJECTION = 'command_injection',
  BUFFER_OVERFLOW = 'buffer_overflow',
  LATERAL_MOVEMENT = 'lateral_movement'
}

export enum TrustService {
  SECURITY = 'Security',
  AVAILABILITY = 'Availability',
  PROCESSING_INTEGRITY = 'Processing Integrity',
  CONFIDENTIALITY = 'Confidentiality',
  PRIVACY = 'Privacy'
}

export enum SecurityControl {
  CC5_1 = 'CC5.1',
  CC5_2 = 'CC5.2',
  CC6_1 = 'CC6.1',
  CC6_2 = 'CC6.2',
  CC6_3 = 'CC6.3',
  CC6_4 = 'CC6.4',
  CC6_5 = 'CC6.5',
  CC6_6 = 'CC6.6',
  CC6_7 = 'CC6.7',
  CC6_8 = 'CC6.8',
  CC7_1 = 'CC7.1',
  CC7_2 = 'CC7.2',
  CC7_3 = 'CC7.3',
  CC7_4 = 'CC7.4',
  CC8_1 = 'CC8.1',
  CC9_1 = 'CC9.1',
  CC9_2 = 'CC9.2',
  A1_1 = 'A1.1',
  A1_2 = 'A1.2',
  A1_3 = 'A1.3',
  C1_1 = 'C1.1',
  C1_2 = 'C1.2',
  PI1_1 = 'PI1.1',
  P1_1 = 'P1.1',
  P2_1 = 'P2.1'
}

export enum TestPriority {
  CRITICAL = 'critical',
  STANDARD = 'standard',
  LOW = 'low'
}

export enum TestStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Interfaces
export interface VulnerabilityMapping {
  attack: AttackType;
  description: string;
  tsc: TrustService[];
  cc: SecurityControl[];
  tools: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface TestResult {
  id: string;
  attack_type: AttackType;
  status: TestStatus;
  findings: Finding[];
  evidence: Evidence[];
  cost: CostMetrics;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_component: string;
  remediation: string;
  evidence_ids: string[];
  cve?: string;
  cvss_score?: number;
}

export interface Evidence {
  id: string;
  type: 'screenshot' | 'log' | 'config' | 'report' | 'code';
  filename: string;
  content: string | Buffer;
  mime_type: string;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface CostMetrics {
  compute_time_minutes: number;
  api_calls: number;
  estimated_cost_dollars: number;
  breakdown?: {
    container_cost: number;
    api_cost: number;
    storage_cost: number;
  };
}

export interface TestJob {
  id?: string;
  attack_type: AttackType;
  target: TestTarget;
  priority: TestPriority;
  viable_attacks: ViableAttacks;
  context?: WorkflowContext;
  scheduled_for?: Date;
  created_at?: Date;
}

export interface TestTarget {
  domain?: string;
  ip?: string;
  url?: string;
  port?: number;
  service?: string;
  metadata?: Record<string, any>;
}

export interface ViableAttacks {
  critical: AttackType[];
  standard: AttackType[];
  lowPriority: AttackType[];
}

export interface WorkflowContext {
  intent: IntentType;
  trust_areas: TrustService[];
  controls: SecurityControl[];
  user_input: string;
  form_data: Record<string, any>;
  risk_level: 'high' | 'medium' | 'low';
  requires_approval: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  embeddings?: {
    input_embedding?: number[];
    correlated_attacks?: Array<{ attack: AttackType; similarity: number }>;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  docker_image: string;
  command_template: string;
  parameters: ToolParameter[];
  output_parser?: string;
  timeout_ms?: number;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default?: any;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// API Request/Response types
export interface RunWorkflowRequest {
  user_input: string;
  form_data: {
    domain?: string;
    ip?: string;
    scope?: string;
    trust_areas?: TrustService[];
    controls?: SecurityControl[];
    [key: string]: any;
  };
  options?: {
    require_approval?: boolean;
    priority?: TestPriority;
    max_concurrent?: number;
  };
}

export interface RunWorkflowResponse {
  workflow_id: string;
  status: 'initiated' | 'pending_approval' | 'running' | 'completed' | 'failed';
  jobs: TestJob[];
  estimated_completion: Date;
  estimated_cost: number;
  approval_required?: boolean;
  approval_url?: string;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  jobs: Array<{
    id: string;
    attack_type: AttackType;
    status: TestStatus;
    priority: TestPriority;
    progress?: number;
  }>;
}

// Compliance types
export interface ComplianceReport {
  workflow_id: string;
  generated_at: Date;
  coverage: {
    trust_services: Record<TrustService, number>;
    controls: Record<SecurityControl, boolean>;
  };
  findings_by_control: Record<SecurityControl, Finding[]>;
  evidence_by_control: Record<SecurityControl, Evidence[]>;
  overall_risk_score: number;
  recommendations: string[];
}

export interface EvidenceExport {
  format: 'vanta' | 'drata' | 'pdf' | 'json';
  controls: SecurityControl[];
  findings: Finding[];
  evidence: Evidence[];
  metadata: {
    exported_at: Date;
    exported_by: string;
    workflow_id: string;
  };
}

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
  permissions: string[];
  created_at: Date;
  last_login?: Date;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
}

// Monitoring types
export interface MetricData {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
}

// Error types
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}