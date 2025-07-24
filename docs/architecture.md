# SOC 2 Testing Platform Architecture

## Overview

The SOC 2 Testing Platform is built on a microservices architecture with clear separation of concerns, designed for scalability, security, and compliance with SOC 2 requirements.

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│   Web API       │────▶│   MCP Server    │
│   (React)       │     │   (Express)     │     │   (Internal)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Queue System  │     │  Docker Engine  │
                        │   (BullMQ)      │     │  (Kali Tools)   │
                        └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   PostgreSQL    │     │   Embeddings    │
                        │   (pgvector)    │     │   (Ollama)      │
                        └─────────────────┘     └─────────────────┘
```

## Core Components

### 1. MCP Server
- **Purpose**: Orchestrates security testing workflows
- **Key Features**:
  - Tool execution management
  - Attack correlation using embeddings
  - No direct web exposure (security by design)
  - Parallel test coordination

### 2. Web API Layer
- **Purpose**: External interface for clients
- **Technologies**: Express, GraphQL (optional)
- **Security**: JWT auth, rate limiting, input validation
- **Responsibilities**:
  - Request validation
  - Authentication/authorization
  - API gateway to MCP server
  - WebSocket for real-time updates

### 3. Queue System
- **Technology**: BullMQ with Redis backend
- **Features**:
  - Priority-based job scheduling
  - Concurrent execution limits
  - Job retry and failure handling
  - Off-hours scheduling for low-priority tests

### 4. Workflow Layers

The system processes requests through multiple layers:

1. **Intent Classification**: Uses embeddings to understand user intent
2. **Trust Classifier**: Maps to SOC 2 Trust Service Criteria
3. **Context Enrichment**: Adds historical data and correlations
4. **HITL Review**: Slack integration for high-risk approvals
5. **Parallel Agent Spawner**: Manages concurrent test execution
6. **Result Processing**: Aggregates and parses tool outputs
7. **Anomaly Detection**: Identifies unusual patterns
8. **Evidence Export**: Formats for compliance platforms
9. **Memory Update**: Stores results in vector database

### 5. Security Architecture

#### Container Isolation
- Each test runs in isolated Docker container
- Network segmentation per test execution
- AppArmor/SELinux profiles for additional security

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external integrations

#### Data Protection
- Encryption at rest (PostgreSQL)
- TLS for all communications
- Secrets management via environment variables

### 6. Monitoring & Observability

- **Metrics**: Prometheus for system metrics
- **Logs**: Centralized logging with Loki
- **Tracing**: Distributed tracing with Jaeger
- **Dashboards**: Grafana for visualization

### 7. Compliance Integration

- **Evidence Collection**: Automated screenshot and log capture
- **Audit Trail**: Complete test execution history
- **Export Formats**: Vanta, Drata, PDF reports
- **Control Mapping**: Dynamic correlation to CC controls

## Scalability Considerations

### Horizontal Scaling
- Backend API instances behind load balancer
- Queue workers scale based on load
- Database read replicas for reporting

### Performance Optimization
- Embedding cache for frequent correlations
- Connection pooling for database
- Progressive testing to minimize resource usage

## Deployment Architecture

### Development
- Docker Compose for local development
- Hot reloading for frontend and backend
- Mock services for external dependencies

### Production
- Kubernetes deployment (optional)
- Auto-scaling based on queue depth
- Blue-green deployments for zero downtime

## Data Flow

1. User submits test request via UI
2. API validates and forwards to MCP server
3. MCP classifies intent and enriches context
4. High-risk tests go through HITL approval
5. Approved tests queued with appropriate priority
6. Workers execute tests in Docker containers
7. Results processed and stored in database
8. Evidence exported to compliance platforms
9. User notified of completion via WebSocket

## Security Considerations

### Network Security
- VPC isolation in cloud deployments
- Private subnets for sensitive components
- WAF for public-facing services

### Application Security
- Input sanitization at all entry points
- OWASP Top 10 compliance
- Regular security scanning of containers

### Operational Security
- Least privilege access principles
- Audit logging for all actions
- Incident response procedures

## Technology Stack Summary

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Node.js, TypeScript, Express
- **Database**: PostgreSQL with pgvector
- **Queue**: Redis with BullMQ
- **Containers**: Docker, Kubernetes (optional)
- **Monitoring**: Prometheus, Grafana, Loki, Jaeger
- **Security Tools**: Kali Linux suite
- **ML/AI**: Ollama for embeddings 