# SOC 2 Penetration Testing Platform - Testing Guide

## Overview

This guide covers everything you need to test the SOC 2 Penetration Testing Platform, including setup, API keys, test scenarios, and troubleshooting.

## Quick Start

### 1. Prerequisites

- Docker Desktop installed and running
- Node.js 16+ and npm installed
- At least 8GB RAM available
- Unix-like shell (bash/zsh)

### 2. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd contexting

# Run the setup script
chmod +x backend/scripts/test-setup.sh
./backend/scripts/test-setup.sh

# Install dependencies
npm install
```

### 3. Start Test Environment

```bash
# Start test services (PostgreSQL, Redis, Test Target)
docker-compose -f docker-compose.test.yml up -d

# Verify services are running
docker ps

# Check logs if needed
docker-compose -f docker-compose.test.yml logs
```

### 4. Configure Environment

```bash
# Copy test environment file
cp backend/.env.test backend/.env

# Edit if needed (optional)
nano backend/.env
```

## API Key Implementation

### Test API Keys

The platform comes with two pre-configured test API keys:

1. **Test Key** (Limited Permissions):
   ```
   sk-test-1234567890abcdefghijklmnopqrstuvwxyz
   ```
   - Permissions: workflows:create, workflows:read, tools:execute
   - Rate limit: 100 requests/hour

2. **Production Key** (Full Access):
   ```
   sk-prod-abcdefghijklmnopqrstuvwxyz1234567890
   ```
   - Permissions: * (all)
   - Rate limit: 1000 requests/hour

### Using API Keys

Include the API key in the `X-API-Key` header:

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "security_test",
    "form_data": {
      "target": "testapp.local",
      "scope": "basic"
    }
  }'
```

## Running Tests

### Option 1: Interactive Test Client

```bash
# Make executable
chmod +x backend/scripts/test-client.js

# Run the interactive client
node backend/scripts/test-client.js

# Follow the menu:
# 1. Check Health
# 2. Register User
# 3. Login
# 4. Create Workflow
# 5. Get Workflow Status
# 6. Approve Workflow
# 7. Run Direct Tool Call
```

### Option 2: HTTP Client (VS Code REST Client / Postman)

Use the provided test API calls in `backend/test-data/test-api-calls.http`:

```http
### 1. Health Check
GET http://localhost:3001/health

### 2. Create User
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}

### 3. Login (Get JWT Token)
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!"
}

### 4. Create Workflow (with JWT)
POST http://localhost:3001/api/workflows
Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>
Content-Type: application/json

{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "full",
    "info_description": "Test for SQL injection and XSS",
    "contact": "test@example.com"
  }
}

### 5. Create Workflow (with API Key)
POST http://localhost:3001/api/workflows
X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz
Content-Type: application/json

{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "basic"
  }
}
```

### Option 3: Automated Script

```bash
# Run automated test suite
npm run test:e2e

# Or manually:
./backend/scripts/run-tests.sh
```

## Test Scenarios

### 1. Basic Security Test
```json
{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "basic",
    "info_description": "Basic vulnerability scan",
    "contact": "security@example.com"
  }
}
```

### 2. SQL Injection Focus
```json
{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "focused",
    "info_description": "Test SQL injection in login forms",
    "specific_endpoints": ["/login", "/api/auth"],
    "contact": "security@example.com"
  }
}
```

### 3. Full SOC 2 Compliance
```json
{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "full",
    "info_description": "Complete SOC 2 compliance test",
    "compliance_requirements": ["SOC2", "ISO27001"],
    "trust_services": ["Security", "Availability", "Confidentiality"],
    "contact": "compliance@example.com"
  }
}
```

### 4. API Security Test
```json
{
  "intent": "security_test",
  "form_data": {
    "target": "api.testapp.local",
    "scope": "api",
    "info_description": "REST API security testing",
    "api_endpoints": [
      "GET /api/users",
      "POST /api/auth/login",
      "PUT /api/users/:id"
    ],
    "contact": "api-team@example.com"
  }
}
```

## Direct Tool Execution

You can also execute security tools directly:

### Port Scan
```bash
curl -X POST http://localhost:3001/api/tools/execute \
  -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "scan_ports",
    "arguments": {
      "target": "testapp.local",
      "ports": "80,443,8080"
    }
  }'
```

### SQL Injection Test
```bash
curl -X POST http://localhost:3001/api/tools/execute \
  -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_sqli",
    "arguments": {
      "target": "http://testapp.local/login.php?id=1",
      "level": 3,
      "risk": 2
    }
  }'
```

## WebSocket Real-time Updates

Connect to WebSocket for real-time workflow updates:

```javascript
// Example WebSocket client
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('subscribe:workflow', 'WORKFLOW_ID');
});

socket.on('workflow:update', (data) => {
  console.log('Workflow update:', data);
});
```

## Testing MCP Server Directly

The MCP server can be tested separately:

```bash
# Start MCP server
node backend/src/mcp-server/server.js

# In another terminal, use the MCP client
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node backend/src/mcp-server/server.js
```

## Monitoring & Debugging

### View Logs
```bash
# API logs
tail -f backend/logs/combined.log

# Docker logs
docker-compose -f docker-compose.test.yml logs -f

# Specific service logs
docker logs soc2-test-target -f
```

### Check Database
```bash
# Connect to test database
docker exec -it soc2-postgres-test psql -U soc2user -d soc2_test

# Example queries
\dt  # List tables
SELECT * FROM workflows;
SELECT * FROM test_results;
```

### Check Redis Queue
```bash
# Connect to Redis
docker exec -it soc2-redis-test redis-cli

# Example commands
KEYS *
LLEN bull:test-queue:waiting
```

## Common Issues & Solutions

### 1. Docker Issues
```bash
# Reset Docker environment
docker-compose -f docker-compose.test.yml down -v
docker system prune -f
docker-compose -f docker-compose.test.yml up -d
```

### 2. Port Conflicts
```bash
# Check what's using ports
lsof -i :3001  # API port
lsof -i :5433  # PostgreSQL port
lsof -i :6380  # Redis port
```

### 3. Permission Errors
```bash
# Fix script permissions
chmod +x backend/scripts/*.sh
chmod +x backend/scripts/*.js
```

### 4. Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://soc2user:soc2pass@localhost:5433/soc2_test
```

## Security Considerations

1. **Test Environment Only**: The provided API keys and credentials are for testing only
2. **Network Isolation**: Test containers run in isolated network
3. **Target Safety**: Only test against the provided test target (DVWA)
4. **Rate Limiting**: Respect rate limits even in testing

## Next Steps

1. **Production Setup**: See `docs/PRODUCTION.md` for production deployment
2. **Custom Tools**: Add new security tools in `backend/src/mcp-server/tools/`
3. **API Documentation**: Full API docs at `http://localhost:3001/api-docs`
4. **Contributing**: See `CONTRIBUTING.md` for development guidelines

## Support

- Check logs first: `backend/logs/`
- GitHub Issues: Report bugs and feature requests
- Documentation: `docs/` directory for detailed guides 