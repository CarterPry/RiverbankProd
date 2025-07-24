#!/bin/bash
# backend/scripts/test-setup.sh

set -e

echo "🔧 SOC 2 Testing Platform - Test Setup Script"
echo "============================================="

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/evidence
mkdir -p backend/test-data

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

# Create test environment file
echo "📝 Creating test environment file..."
cat > backend/.env.test << EOF
# Test Environment Configuration
NODE_ENV=test
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://soc2user:soc2pass@localhost:5432/soc2_test
REDIS_URL=redis://localhost:6379

# Docker
DOCKER_HOST=unix:///var/run/docker.sock
KALI_IMAGE=kalilinux/kali-rolling:latest

# API Keys (Test Keys)
OPENAI_API_KEY=sk-test-1234567890abcdef
ANTHROPIC_API_KEY=sk-ant-test-1234567890abcdef
JWT_SECRET=test-jwt-secret-change-in-production
ENCRYPTION_KEY=test-encryption-key-32-characters

# Embeddings
EMBEDDING_MODEL=text-embedding-ada-002
OLLAMA_BASE_URL=http://localhost:11434

# Test Configuration
TEST_TIMEOUT_MS=30000
MAX_CONCURRENT_TESTS=2
ALLOWED_TARGETS=localhost,127.0.0.1,testapp.local

# Monitoring
PROMETHEUS_ENABLED=false
LOKI_URL=
EOF

# Create test data
echo "📊 Creating test data..."
cat > backend/test-data/sample-workflow.json << EOF
{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "full",
    "info_description": "Test our web application for SQL injection and XSS vulnerabilities",
    "contact": "test@example.com",
    "compliance_requirements": ["SOC2", "ISO27001"]
  }
}
EOF

cat > backend/test-data/test-api-calls.http << EOF
### Health Check
GET http://localhost:3001/health

### Create Test User
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}

### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!"
}

### Create Workflow (replace TOKEN with actual token from login)
POST http://localhost:3001/api/workflows
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "intent": "security_test",
  "form_data": {
    "target": "testapp.local",
    "scope": "full",
    "info_description": "Test for SQL injection and XSS vulnerabilities",
    "contact": "test@example.com"
  }
}

### Get Workflow Status
GET http://localhost:3001/api/workflows/WORKFLOW_ID
Authorization: Bearer TOKEN

### Approve Workflow
POST http://localhost:3001/api/workflows/WORKFLOW_ID/approve
Authorization: Bearer TOKEN
EOF

# Create docker-compose for test dependencies
echo "🐳 Creating test docker-compose..."
cat > docker-compose.test.yml << EOF
version: '3.8'

services:
  postgres-test:
    image: pgvector/pgvector:pg16
    container_name: soc2-postgres-test
    environment:
      POSTGRES_USER: soc2user
      POSTGRES_PASSWORD: soc2pass
      POSTGRES_DB: soc2_test
    ports:
      - "5433:5432"
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - soc2-test-network

  redis-test:
    image: redis:7-alpine
    container_name: soc2-redis-test
    ports:
      - "6380:6379"
    networks:
      - soc2-test-network

  test-target:
    image: vulnerables/web-dvwa
    container_name: soc2-test-target
    ports:
      - "8080:80"
    networks:
      - soc2-test-network
    extra_hosts:
      - "testapp.local:127.0.0.1"

networks:
  soc2-test-network:
    driver: bridge
EOF

# Create test runner script
echo "🧪 Creating test runner..."
cat > backend/scripts/run-tests.sh << EOF
#!/bin/bash

echo "🚀 Starting test environment..."

# Start test services
docker-compose -f docker-compose.test.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
npm run migrate:test

# Start the API server
echo "🌐 Starting API server..."
NODE_ENV=test npm run dev &
API_PID=\$!

# Wait for API to start
sleep 5

# Run tests
echo "🧪 Running integration tests..."
npm run test:integration

# Cleanup
echo "🧹 Cleaning up..."
kill \$API_PID
docker-compose -f docker-compose.test.yml down

echo "✅ Tests complete!"
EOF

chmod +x backend/scripts/run-tests.sh

echo "✅ Test setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start test services: docker-compose -f docker-compose.test.yml up -d"
echo "2. Install dependencies: npm install"
echo "3. Run tests: ./backend/scripts/run-tests.sh"
echo "4. Use the test API calls in backend/test-data/test-api-calls.http" 