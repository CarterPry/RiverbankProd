-- database/init.sql
-- PostgreSQL with pgvector extension for SOC 2 Testing Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For compound indexes

-- Create custom types
CREATE TYPE test_status AS ENUM (
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'timeout',
  'cancelled'
);

CREATE TYPE severity AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'info'
);

CREATE TYPE evidence_type AS ENUM (
  'screenshot',
  'log',
  'config',
  'network_capture',
  'file',
  'command_output'
);

-- ===================== CORE TABLES =====================

-- Embeddings table for vector storage
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vector vector(384) NOT NULL, -- 384 dimensions for nomic-embed-text
  text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding_model VARCHAR(255) DEFAULT 'nomic-embed-text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vector similarity search
CREATE INDEX embeddings_vector_idx ON embeddings 
  USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);

-- Index for metadata queries
CREATE INDEX embeddings_metadata_idx ON embeddings USING GIN (metadata);
CREATE INDEX embeddings_type_idx ON embeddings ((metadata->>'type'));

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  user_input TEXT NOT NULL,
  form_data JSONB DEFAULT '{}',
  context JSONB NOT NULL, -- EnrichedContext
  status test_status DEFAULT 'pending',
  options JSONB DEFAULT '{}',
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(50),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  slack_message_ts VARCHAR(255),
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10, 4),
  actual_cost_usd DECIMAL(10, 4),
  cost_breakdown JSONB DEFAULT '{}'
);

-- Test results table
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  attack_type VARCHAR(100) NOT NULL,
  status test_status DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'standard',
  
  -- Execution details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  tool_used VARCHAR(255),
  command_executed TEXT[],
  docker_image VARCHAR(255),
  exit_code INTEGER,
  error TEXT,
  
  -- Output
  raw_output TEXT,
  parsed_output JSONB DEFAULT '{}',
  
  -- Cost
  cost JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Findings table
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  
  severity severity NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  affected_component VARCHAR(500),
  
  -- Security details
  cve_ids TEXT[],
  cvss_score DECIMAL(3, 1),
  
  -- SOC 2 mapping
  affected_controls TEXT[], -- Array of control IDs
  affected_trusts TEXT[], -- Array of trust services
  
  -- Remediation
  remediation TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evidence table
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  
  type evidence_type NOT NULL,
  filename VARCHAR(500) NOT NULL,
  content_type VARCHAR(255),
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  hash_sha256 VARCHAR(64),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historical baselines table
CREATE TABLE baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  control_id VARCHAR(50) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  
  -- Validity period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP WITH TIME ZONE,
  
  -- Source
  source_workflow_id UUID REFERENCES workflows(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(control_id, metric_name, valid_to)
);

-- Anomalies table
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Comparison data
  current_value JSONB,
  baseline_value JSONB,
  deviation_percentage DECIMAL(10, 2),
  
  -- Detection details
  detection_method VARCHAR(100),
  similar_historical_events JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance mappings table (cached from code)
CREATE TABLE compliance_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attack_type VARCHAR(100) NOT NULL,
  trust_services TEXT[] NOT NULL,
  controls TEXT[] NOT NULL,
  tools TEXT[] NOT NULL,
  
  -- Correlation strength from embeddings
  correlation_scores JSONB DEFAULT '{}',
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attack_type)
);

-- Export records table
CREATE TABLE export_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL, -- 'vanta', 'drata', 'pdf', 's3'
  status VARCHAR(50) NOT NULL, -- 'success', 'failed'
  
  -- Export details
  export_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queue jobs table (backup for BullMQ)
CREATE TABLE queue_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  
  job_type VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'standard',
  data JSONB NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- Memory/checkpoint table
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  checkpoint_type VARCHAR(100) NOT NULL,
  
  state JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================== INDEXES =====================

-- Workflows indexes
CREATE INDEX workflows_status_idx ON workflows(status);
CREATE INDEX workflows_user_id_idx ON workflows(user_id);
CREATE INDEX workflows_created_at_idx ON workflows(created_at DESC);
CREATE INDEX workflows_requires_approval_idx ON workflows(requires_approval) WHERE requires_approval = true;

-- Test results indexes
CREATE INDEX test_results_workflow_id_idx ON test_results(workflow_id);
CREATE INDEX test_results_status_idx ON test_results(status);
CREATE INDEX test_results_attack_type_idx ON test_results(attack_type);
CREATE INDEX test_results_created_at_idx ON test_results(created_at DESC);

-- Findings indexes
CREATE INDEX findings_test_result_id_idx ON findings(test_result_id);
CREATE INDEX findings_workflow_id_idx ON findings(workflow_id);
CREATE INDEX findings_severity_idx ON findings(severity);
CREATE INDEX findings_controls_idx ON findings USING GIN(affected_controls);
CREATE INDEX findings_trusts_idx ON findings USING GIN(affected_trusts);

-- Evidence indexes
CREATE INDEX evidence_test_result_id_idx ON evidence(test_result_id);
CREATE INDEX evidence_finding_id_idx ON evidence(finding_id);
CREATE INDEX evidence_type_idx ON evidence(type);

-- Baselines indexes
CREATE INDEX baselines_control_id_idx ON baselines(control_id);
CREATE INDEX baselines_valid_period_idx ON baselines(valid_from, valid_to);

-- Anomalies indexes
CREATE INDEX anomalies_workflow_id_idx ON anomalies(workflow_id);
CREATE INDEX anomalies_type_idx ON anomalies(type);
CREATE INDEX anomalies_confidence_idx ON anomalies(confidence);

-- Queue jobs indexes
CREATE INDEX queue_jobs_status_idx ON queue_jobs(status);
CREATE INDEX queue_jobs_priority_idx ON queue_jobs(priority);
CREATE INDEX queue_jobs_next_retry_idx ON queue_jobs(next_retry_at) WHERE status = 'pending';

-- ===================== VIEWS =====================

-- Workflow summary view
CREATE VIEW workflow_summaries AS
SELECT 
  w.id,
  w.user_id,
  w.status,
  w.created_at,
  w.started_at,
  w.completed_at,
  w.actual_cost_usd,
  COUNT(DISTINCT tr.id) as total_tests,
  COUNT(DISTINCT f.id) as total_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'critical') as critical_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'high') as high_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'medium') as medium_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'low') as low_findings
FROM workflows w
LEFT JOIN test_results tr ON w.id = tr.workflow_id
LEFT JOIN findings f ON tr.id = f.test_result_id
GROUP BY w.id;

-- Control coverage view
CREATE VIEW control_coverage AS
SELECT 
  w.id as workflow_id,
  unnest(f.affected_controls) as control_id,
  COUNT(DISTINCT f.id) as finding_count,
  MAX(f.severity::text) as max_severity
FROM workflows w
JOIN findings f ON w.id = f.workflow_id
GROUP BY w.id, control_id;

-- ===================== FUNCTIONS =====================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to embeddings
CREATE TRIGGER update_embeddings_updated_at 
  BEFORE UPDATE ON embeddings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to find similar embeddings
CREATE OR REPLACE FUNCTION find_similar_embeddings(
  query_vector vector(384),
  metadata_filter JSONB DEFAULT '{}',
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  text TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.text,
    e.metadata,
    1 - (e.vector <=> query_vector) as similarity
  FROM embeddings e
  WHERE 
    CASE 
      WHEN metadata_filter = '{}'::jsonb THEN TRUE
      ELSE e.metadata @> metadata_filter
    END
  ORDER BY e.vector <=> query_vector
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate workflow coverage
CREATE OR REPLACE FUNCTION calculate_workflow_coverage(workflow_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  total_controls INTEGER;
  tested_controls INTEGER;
  passed_controls INTEGER;
  failed_controls INTEGER;
  coverage_percentage NUMERIC;
  result JSONB;
BEGIN
  -- Get total expected controls based on trust services
  -- This is simplified - in reality would check context for selected trusts
  total_controls := 20; -- Example: total SOC 2 controls
  
  -- Count tested controls
  SELECT COUNT(DISTINCT unnest(affected_controls))
  INTO tested_controls
  FROM findings
  WHERE workflow_id = workflow_uuid;
  
  -- Count passed controls (no findings)
  -- This would need more complex logic in production
  passed_controls := tested_controls - failed_controls;
  
  -- Calculate coverage
  coverage_percentage := CASE 
    WHEN total_controls > 0 THEN (tested_controls::NUMERIC / total_controls) * 100
    ELSE 0
  END;
  
  result := jsonb_build_object(
    'total_controls', total_controls,
    'tested_controls', tested_controls,
    'passed_controls', passed_controls,
    'failed_controls', failed_controls,
    'coverage_percentage', coverage_percentage
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===================== INITIAL DATA =====================

-- Insert default compliance mappings (will be updated by application)
INSERT INTO compliance_mappings (attack_type, trust_services, controls, tools) VALUES
('sql_injection', ARRAY['Security'], ARRAY['CC6.1', 'CC6.6'], ARRAY['sqlmap']),
('xss', ARRAY['Security'], ARRAY['CC6.1', 'CC6.6'], ARRAY['zap', 'burp']),
('broken_authentication', ARRAY['Security'], ARRAY['CC6.1', 'CC6.2', 'CC6.3'], ARRAY['hydra', 'burp']),
('clickjacking', ARRAY['Security'], ARRAY['CC6.1', 'CC6.7'], ARRAY['nikto', 'zap'])
ON CONFLICT (attack_type) DO NOTHING;