# SOC 2 Penetration Testing Platform

A comprehensive automated security testing platform designed for SOC 2 compliance, leveraging MCP (Model Context Protocol) server architecture with embeddings-based attack correlation and parallel test execution.

## Overview

This platform automates penetration testing workflows specifically tailored for SOC 2 compliance requirements. It uses advanced embeddings to correlate attacks with Trust Service Criteria (TSC) and Common Criteria (CC) controls, ensuring comprehensive coverage and audit-ready evidence generation.

## Architecture

The platform follows a monorepo structure with separated concerns:

- **MCP Server**: Core testing orchestration without web exposure
- **Web API**: REST/GraphQL endpoints for client interaction
- **Queue System**: BullMQ-based parallel test execution
- **Embeddings Engine**: Ollama-powered attack correlation
- **Docker Integration**: Isolated Kali Linux containers for testing
- **Evidence Export**: Automated integration with Vanta/Drata

## Key Features

- **Intelligent Attack Correlation**: Uses embeddings to map user inputs to relevant attacks
- **Parallel Execution**: Queue-based system supporting concurrent tests with resource limits
- **Progressive Testing**: Starts with lightweight scans, escalates based on findings
- **HITL Integration**: Slack-based approval for high-risk operations
- **Comprehensive Monitoring**: Prometheus/Grafana/Jaeger for full observability
- **Audit-Ready Evidence**: Automated formatting and export to compliance platforms

## Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL with pgvector extension
- Redis (for BullMQ)
- Ollama (for embeddings)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/soc2-testing-platform.git
cd soc2-testing-platform
```

2. Install dependencies:
```bash
npm install --workspaces
```

3. Copy environment configuration:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start infrastructure services:
```bash
docker-compose up -d db redis embeddings
```

5. Run database migrations:
```bash
npm run migrate:db --workspace=backend
```

6. Start the platform:
```bash
# Development
npm run dev:all

# Production
npm run build:all
docker-compose -f docker-compose.prod.yml up
```

## Usage

### Running a SOC 2 Workflow

```bash
curl -X POST http://localhost:3000/api/run-soc2-workflow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userInput": "Test authentication mechanisms for our domain example.com",
    "formData": {
      "domain": "example.com",
      "scope": "authentication",
      "trustAreas": ["Security"]
    }
  }'
```

### Monitoring Test Progress

Access the monitoring dashboards:
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

## Testing

```bash
# Run all tests
npm run test:all

# Run specific workspace tests
npm run test --workspace=backend

# Run with coverage
npm run test:coverage --workspace=backend

# Load testing
npm run test:load --workspace=backend
```

## Project Structure

```
soc2-testing-platform/
├── backend/                 # Core backend services
│   ├── src/
│   │   ├── mcp-server/     # MCP server implementation
│   │   ├── api/            # Web API layer
│   │   ├── layers/         # Workflow processing layers
│   │   ├── services/       # Business logic
│   │   ├── compliance/     # SOC 2 mappings and validators
│   │   └── queue/          # Test queue management
├── frontend/               # React-based UI
├── monitoring/             # Observability stack
├── docker/                 # Container configurations
├── scripts/                # Utility scripts
└── templates/              # Test methodology templates
```

## Configuration

Key configuration options in `.env`:

- `MAX_CONCURRENT_TESTS`: Maximum parallel test executions (default: 4)
- `TEST_TIMEOUT_MS`: Test execution timeout (default: 300000ms)
- `OLLAMA_MODEL`: Embedding model to use (default: llama2)
- `SLACK_CHANNEL`: Channel for HITL approvals

## Security Considerations

- All tests run in isolated Docker containers
- Network isolation per test execution
- AppArmor/SELinux profiles for container security
- JWT-based authentication for API access
- Rate limiting and input validation

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/soc2-testing-platform/issues)
- Documentation: [Full docs](docs/) 