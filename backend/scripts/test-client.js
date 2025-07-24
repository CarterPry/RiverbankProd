#!/usr/bin/env node
// backend/scripts/test-client.js

const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_DATA_DIR = path.join(__dirname, '../test-data');

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Store authentication token
let authToken = null;
let currentWorkflowId = null;

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Test scenarios
const testScenarios = {
  1: {
    name: 'Basic Security Test',
    data: {
      intent: 'security_test',
      form_data: {
        target: 'testapp.local',
        scope: 'basic',
        info_description: 'Test for common web vulnerabilities',
        contact: 'security@example.com'
      }
    }
  },
  2: {
    name: 'SQL Injection Test',
    data: {
      intent: 'security_test',
      form_data: {
        target: 'testapp.local',
        scope: 'focused',
        info_description: 'Focus on SQL injection vulnerabilities in login and search forms',
        contact: 'security@example.com',
        specific_endpoints: ['/login', '/search', '/api/users']
      }
    }
  },
  3: {
    name: 'Full Compliance Test',
    data: {
      intent: 'security_test',
      form_data: {
        target: 'testapp.local',
        scope: 'full',
        info_description: 'Complete SOC 2 compliance testing including all TSC categories',
        contact: 'compliance@example.com',
        compliance_requirements: ['SOC2', 'ISO27001'],
        trust_services: ['Security', 'Availability', 'Confidentiality']
      }
    }
  },
  4: {
    name: 'API Security Test',
    data: {
      intent: 'security_test',
      form_data: {
        target: 'api.testapp.local',
        scope: 'api',
        info_description: 'Test REST API for authentication bypass and authorization issues',
        contact: 'api-team@example.com',
        api_endpoints: [
          'GET /api/v1/users',
          'POST /api/v1/auth/login',
          'PUT /api/v1/users/:id',
          'DELETE /api/v1/resources/:id'
        ]
      }
    }
  }
};

// Helper functions
async function checkHealth() {
  try {
    const response = await api.get('/health');
    console.log('✅ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed');
    return false;
  }
}

async function register() {
  console.log('\n📝 User Registration');
  const email = await question('Email: ');
  const password = await question('Password: ');
  const name = await question('Name: ');

  try {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      name
    });
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.error('❌ Registration failed');
  }
}

async function login() {
  console.log('\n🔐 User Login');
  const email = await question('Email: ');
  const password = await question('Password: ');

  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken);
    
    // Save token to file for reuse
    fs.writeFileSync(path.join(TEST_DATA_DIR, '.auth-token'), authToken);
  } catch (error) {
    console.error('❌ Login failed');
  }
}

async function createWorkflow() {
  if (!authToken) {
    console.log('❌ Please login first');
    return;
  }

  console.log('\n📋 Available Test Scenarios:');
  Object.entries(testScenarios).forEach(([key, scenario]) => {
    console.log(`  ${key}. ${scenario.name}`);
  });

  const choice = await question('\nSelect scenario (1-4): ');
  const scenario = testScenarios[choice];

  if (!scenario) {
    console.log('❌ Invalid choice');
    return;
  }

  console.log(`\n🚀 Creating workflow: ${scenario.name}`);
  
  try {
    const response = await api.post('/api/workflows', scenario.data);
    currentWorkflowId = response.data.workflow_id;
    console.log('✅ Workflow created successfully');
    console.log('Workflow ID:', currentWorkflowId);
    console.log('Status:', response.data.status);
    console.log('Estimated completion:', response.data.estimated_completion);
    console.log('Estimated cost: $', response.data.estimated_cost);
    
    if (response.data.requires_approval) {
      console.log('⚠️  This workflow requires approval before execution');
    }
  } catch (error) {
    console.error('❌ Failed to create workflow');
  }
}

async function getWorkflowStatus() {
  if (!authToken) {
    console.log('❌ Please login first');
    return;
  }

  const workflowId = await question('Workflow ID (or press Enter for current): ');
  const id = workflowId || currentWorkflowId;

  if (!id) {
    console.log('❌ No workflow ID provided');
    return;
  }

  try {
    const response = await api.get(`/api/workflows/${id}`);
    console.log('\n📊 Workflow Status:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Failed to get workflow status');
  }
}

async function approveWorkflow() {
  if (!authToken) {
    console.log('❌ Please login first');
    return;
  }

  const workflowId = await question('Workflow ID (or press Enter for current): ');
  const id = workflowId || currentWorkflowId;

  if (!id) {
    console.log('❌ No workflow ID provided');
    return;
  }

  try {
    const response = await api.post(`/api/workflows/${id}/approve`);
    console.log('✅ Workflow approved');
    console.log('Status:', response.data.status);
  } catch (error) {
    console.error('❌ Failed to approve workflow');
  }
}

async function runDirectToolCall() {
  if (!authToken) {
    console.log('❌ Please login first');
    return;
  }

  console.log('\n🔧 Direct Tool Call');
  console.log('Available tools:');
  console.log('  1. scan_ports - Port scanning');
  console.log('  2. test_sqli - SQL injection test');
  console.log('  3. test_xss - XSS test');
  console.log('  4. check_ssl - SSL/TLS check');

  const tool = await question('Select tool: ');
  const target = await question('Target: ');

  const toolCalls = {
    '1': {
      name: 'scan_ports',
      arguments: { target, ports: '80,443,8080' }
    },
    '2': {
      name: 'test_sqli',
      arguments: { target, level: 3, risk: 2 }
    },
    '3': {
      name: 'test_xss',
      arguments: { target, crawl: true }
    },
    '4': {
      name: 'check_ssl',
      arguments: { target, port: 443 }
    }
  };

  const toolCall = toolCalls[tool];
  if (!toolCall) {
    console.log('❌ Invalid tool selection');
    return;
  }

  try {
    const response = await api.post('/api/tools/execute', toolCall);
    console.log('✅ Tool execution complete');
    console.log('Results:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Tool execution failed');
  }
}

async function loadSavedToken() {
  try {
    const tokenPath = path.join(TEST_DATA_DIR, '.auth-token');
    if (fs.existsSync(tokenPath)) {
      authToken = fs.readFileSync(tokenPath, 'utf8').trim();
      console.log('✅ Loaded saved authentication token');
      return true;
    }
  } catch (error) {
    console.log('No saved token found');
  }
  return false;
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function showMenu() {
  console.log('\n📋 SOC 2 Testing Platform - Test Client');
  console.log('=====================================');
  console.log('1. Check Health');
  console.log('2. Register User');
  console.log('3. Login');
  console.log('4. Create Workflow');
  console.log('5. Get Workflow Status');
  console.log('6. Approve Workflow');
  console.log('7. Run Direct Tool Call');
  console.log('8. Load Test Scenario from File');
  console.log('9. Exit');
  console.log('');
  
  if (authToken) {
    console.log('✅ Authenticated');
  } else {
    console.log('❌ Not authenticated');
  }
  
  const choice = await question('\nSelect option: ');

  switch (choice) {
    case '1':
      await checkHealth();
      break;
    case '2':
      await register();
      break;
    case '3':
      await login();
      break;
    case '4':
      await createWorkflow();
      break;
    case '5':
      await getWorkflowStatus();
      break;
    case '6':
      await approveWorkflow();
      break;
    case '7':
      await runDirectToolCall();
      break;
    case '8':
      // Load from file
      const fileData = fs.readFileSync(
        path.join(TEST_DATA_DIR, 'sample-workflow.json'),
        'utf8'
      );
      console.log('Loaded test data:', fileData);
      break;
    case '9':
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
    default:
      console.log('❌ Invalid choice');
  }

  // Show menu again
  await showMenu();
}

// Main execution
async function main() {
  console.log('🚀 Starting SOC 2 Testing Platform Test Client');
  console.log(`API URL: ${API_BASE_URL}`);

  // Try to load saved token
  await loadSavedToken();

  // Check health first
  const healthy = await checkHealth();
  if (!healthy) {
    console.log('⚠️  Warning: API server may not be running');
  }

  // Start interactive menu
  await showMenu();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Start the client
main().catch(console.error); 