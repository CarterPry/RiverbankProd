// shared/types/index.ts
// This file contains all shared types used across backend and frontend

// ============= Core Enums =============
export enum TrustService {
  SECURITY = 'Security',
  AVAILABILITY = 'Availability',
  PROCESSING_INTEGRITY = 'Processing Integrity',
  CONFIDENTIALITY = 'Confidentiality',
  PRIVACY = 'Privacy'
}

export enum SecurityControl {
  CC5_1 = 'CC5.1', // Selection and Development of Controls
  CC5_2 = 'CC5.2', // Internal Control Monitoring
  CC6_1 = 'CC6.1', // Logical and Physical Access Controls
  CC6_2 = 'CC6.2', // Prior to Issuing System Credentials
  CC6_3 = 'CC6.3', // Removal of Access
  CC6_4 = 'CC6.4', // Access Restrictions
  CC6_5 = 'CC6.5', // Data Disposal
  CC6_6 = 'CC6.6', // Vulnerability Management
  CC6_7 = 'CC6.7', // Data Transmission
  CC6_8 = 'CC6.8', // Malicious Software Prevention
  CC7_1 = 'CC7.1', // Detection and Monitoring
  CC7_2 = 'CC7.2', // Incident Response
  CC7_3 = 'CC7.3', // Evaluation of Security Events
  CC7_4 = 'CC7.4', // Response to Security Incidents
  CC7_5 = 'CC7.5', // Security Breach Notification
  // Add more as needed
}

export enum AttackType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  IDOR = 'idor',
  CLICKJACKING = 'clickjacking',
  XXE = 'xxe',
  SSRF = 'ssrf',
  FILE_UPLOAD = 'file_upload',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  LDAP_INJECTION = 'ldap_injection',
  BROKEN_AUTH = 'broken_authentication',
  SENSITIVE_DATA_EXPOSURE = 'sensitive_data_exposure',
  BROKEN_ACCESS_CONTROL = 'broken_access_control',
  SECURITY_MISCONFIG = 'security_misconfiguration',
  INSUFFICIENT_LOGGING = 'insufficient_logging',
  RATE_LIMITING = 'rate_limiting',
  // Infrastructure
  OPEN_PORTS = 'open_ports',
  WEAK_ENCRYPTION = 'weak_encryption',
  MISSING_PATCHES = 'missing_patches',
  DEFAULT_CREDENTIALS = 'default_credentials',
  MISCONFIGURED_SERVICES = 'misconfigured_services'
}

export enum IntentType {
  SECURITY_TEST = 'security_test',
  AVAILABILITY_TEST = 'availability_test',
  PRIVACY_TEST = 'privacy_test',
  CONFIDENTIALITY_TEST = 'confidentiality_test',
  PROCESSING_TEST = 'processing_integrity_test',
  GENERAL_AUDIT = 'general_audit',
  SPECIFIC_CONTROL = 'specific_control_test',
  VULNERABILITY_SCAN = 'vulnerability_scan',
  COMPLIANCE_CHECK = 'compliance_check',
  INCIDENT_RESPONSE = 'incident_response_test',
  UNKNOWN = 'unknown'
}

export enum TestStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

// ============= Core Interfaces =============

export interface ClassifiedIntent {
  primary_intent: IntentType;
  confidence: number;
  secondary_intents: Array<{
    intent: IntentType;
    confidence: number;
  }>;
  extracted_entities: {
    domains?: string[];
    ip_addresses?: string[];
    control_ids?: string[];
    services?: string[];
    timeframes?: string[];
  };
  matched_attacks: AttackType[];
  suggested_scope: string[];
  urgency_level: 'immediate' | 'scheduled' | 'exploratory';
  natural_language_summary: string;
}

export interface ViableAttacks {
  critical: AttackType[];
  standard: AttackType[];
  lowPriority: AttackType[];
}

export interface EnrichedContext {
  original_input: string;
  classified_intent: ClassifiedIntent;
  form_data?: any;
  trust_services: TrustService[];
  controls: SecurityControl[];
  methodologies: string[];
  viable_attacks: ViableAttacks;
  historical_context?: {
    similar_tests: any[];
    last_test_date?: Date;
    baseline_metrics?: Record<string, any>;
  };
  compliance_thresholds?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  cost_estimate?: CostEstimate;
}

export interface TestResult {
  id: string;
  attack_type: AttackType;
  status: TestStatus;
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  
  // Findings
  findings: Finding[];
  raw_output?: string;
  
  // Evidence
  evidence: Evidence[];
  
  // Cost tracking
  cost: CostMetrics;
  
  // Metadata
  tool_used: string;
  command_executed: string[];
  docker_image: string;
  exit_code?: number;
  error?: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affected_component: string;
  evidence_refs: string[]; // IDs of related evidence
  remediation?: string;
  cve_ids?: string[];
  cvss_score?: number;
  
  // SOC 2 mapping
  affected_controls: SecurityControl[];
  affected_trusts: TrustService[];
}

export interface Evidence {
  id: string;
  type: 'screenshot' | 'log' | 'config' | 'network_capture' | 'file' | 'command_output';
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  hash_sha256: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CostMetrics {
  compute_time_seconds: number;
  api_calls: number;
  data_processed_mb: number;
  estimated_cost_usd: number;
  breakdown: {
    compute: number;
    api: number;
    storage: number;
    network: number;
  };
}

export interface CostEstimate {
  estimated_duration_ms: number;
  estimated_cost_usd: number;
  cost_breakdown: {
    per_attack: Record<AttackType, number>;
    total_compute: number;
    total_api: number;
  };
}

// ============= Vulnerability Mapping =============
export interface VulnerabilityMapping {
  attack: AttackType;
  name: string;
  description: string;
  tsc: TrustService[];
  cc_controls: SecurityControl[];
  tools: string[];
  severity_range: {
    min: Severity;
    max: Severity;
  };
}

// ============= Workflow Types =============
export interface WorkflowRequest {
  user_input: string;
  form_data?: {
    company_name?: string;
    domains?: string[];
    technologies?: string[];
    environments?: string[];
    specific_concerns?: string;
    info_description?: string; // For info-to-attack matching
  };
  options?: {
    max_parallel?: number;
    timeout_override_ms?: number;
    cost_limit_usd?: number;
    skip_low_priority?: boolean;
    use_ai_enhancement?: boolean;
  };
}

export interface WorkflowResponse {
  workflow_id: string;
  status: 'accepted' | 'rejected' | 'pending_approval';
  estimated_duration_ms?: number;
  estimated_cost?: CostEstimate;
  approval_required?: {
    reason: string;
    slack_message_ts?: string;
  };
}

export interface WorkflowResult {
  workflow_id: string;
  status: TestStatus;
  started_at: Date;
  completed_at?: Date;
  
  // Context
  context: EnrichedContext;
  
  // Results
  test_results: TestResult[];
  
  // Aggregated findings
  total_findings: number;
  findings_by_severity: Record<Severity, number>;
  findings_by_control: Record<SecurityControl, Finding[]>;
  
  // Coverage
  controls_tested: SecurityControl[];
  controls_passed: SecurityControl[];
  controls_failed: SecurityControl[];
  coverage_percentage: number;
  
  // Cost
  total_cost: CostMetrics;
  
  // Anomalies detected
  anomalies?: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  
  // Export info
  exports?: Array<{
    platform: 'vanta' | 'drata' | 'pdf' | 's3';
    status: 'success' | 'failed';
    url?: string;
    error?: string;
  }>;
}

// ============= MCP Tool Types =============
export interface MCPToolCall {
  tool: string;
  arguments: Record<string, any>;
  timeout_ms?: number;
  priority?: 'critical' | 'standard' | 'low';
}

export interface MCPToolResult {
  tool: string;
  success: boolean;
  output?: any;
  error?: string;
  duration_ms: number;
  cost?: CostMetrics;
}

// ============= Queue Types =============
export interface TestJob {
  id: string;
  workflow_id: string;
  attack_type: AttackType;
  priority: 'critical' | 'standard' | 'low';
  target: string;
  context: EnrichedContext;
  created_at: Date;
  attempts: number;
  max_attempts: number;
}

// ============= Embedding Types =============
export interface EmbeddingVector {
  id: string;
  vector: number[];
  dimensions: number;
  text: string;
  metadata: {
    type: 'attack' | 'control' | 'finding' | 'intent' | 'description';
    source: string;
    created_at: Date;
    [key: string]: any;
  };
}