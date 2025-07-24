#!/bin/bash
# test-platform.sh - One-command test script for SOC 2 Testing Platform

set -e

echo "🚀 SOC 2 Penetration Testing Platform - Quick Test"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker Desktop"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 16+ from https://nodejs.org"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to setup environment
setup_environment() {
    echo ""
    echo "🔧 Setting up test environment..."
    
    # Create directories
    mkdir -p backend/logs backend/uploads backend/evidence backend/test-data docs
    
    # Run setup script if exists
    if [ -f "backend/scripts/test-setup.sh" ]; then
        chmod +x backend/scripts/test-setup.sh
        ./backend/scripts/test-setup.sh
    fi
    
    # Start test services
    echo "🐳 Starting test services..."
    if [ -f "docker-compose.test.yml" ]; then
        docker-compose -f docker-compose.test.yml up -d
    else
        echo -e "${YELLOW}⚠️  docker-compose.test.yml not found, skipping service startup${NC}"
    fi
    
    # Wait for services
    echo "⏳ Waiting for services to start (15 seconds)..."
    sleep 15
}

# Function to run quick test
run_quick_test() {
    echo ""
    echo "🧪 Running quick test..."
    echo ""
    echo "Test Configuration:"
    echo "- API URL: http://localhost:3001"
    echo "- Test Target: http://localhost:8080 (DVWA)"
    echo "- Test API Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz"
    echo ""
    
    # Health check
    echo "1️⃣ Testing API health..."
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  API not responding, you may need to start it manually${NC}"
        echo "   Run: cd backend && npm run dev"
    fi
    
    # Test workflow creation with API key
    echo ""
    echo "2️⃣ Creating test workflow..."
    
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/workflows \
        -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \
        -H "Content-Type: application/json" \
        -d '{
            "intent": "security_test",
            "form_data": {
                "target": "testapp.local",
                "scope": "basic",
                "info_description": "Quick test scan",
                "contact": "test@example.com"
            }
        }' 2>/dev/null || echo '{"error": "Connection failed"}')
    
    if echo "$RESPONSE" | grep -q "workflow_id"; then
        echo -e "${GREEN}✅ Workflow created successfully${NC}"
        echo "Response: $RESPONSE"
    else
        echo -e "${YELLOW}⚠️  Could not create workflow${NC}"
        echo "Response: $RESPONSE"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Start the API server (if not running):"
    echo "   ${GREEN}cd backend && npm install && npm run dev${NC}"
    echo ""
    echo "2. Run the interactive test client:"
    echo "   ${GREEN}node backend/scripts/test-client.js${NC}"
    echo ""
    echo "3. Access the test target (DVWA):"
    echo "   ${GREEN}http://localhost:8080${NC}"
    echo "   Username: admin"
    echo "   Password: password"
    echo ""
    echo "4. Read the full testing guide:"
    echo "   ${GREEN}cat docs/TESTING_GUIDE.md${NC}"
    echo ""
    echo "5. View logs:"
    echo "   ${GREEN}docker-compose -f docker-compose.test.yml logs -f${NC}"
    echo ""
    echo "6. Stop test services when done:"
    echo "   ${GREEN}docker-compose -f docker-compose.test.yml down${NC}"
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    run_quick_test
    show_next_steps
    
    echo ""
    echo -e "${GREEN}✅ Test setup complete!${NC}"
    echo ""
    echo "🎯 Quick Test Commands:"
    echo ""
    echo "# Test port scanning:"
    echo 'curl -X POST http://localhost:3001/api/tools/execute \'
    echo '  -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"name": "scan_ports", "arguments": {"target": "testapp.local", "ports": "80,443"}}'"'"
    echo ""
    echo "# Test SQL injection:"
    echo 'curl -X POST http://localhost:3001/api/tools/execute \'
    echo '  -H "X-API-Key: sk-test-1234567890abcdefghijklmnopqrstuvwxyz" \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"name": "test_sqli", "arguments": {"target": "http://testapp.local/vulnerabilities/sqli/"}}'"'"
}

# Run main function
main 