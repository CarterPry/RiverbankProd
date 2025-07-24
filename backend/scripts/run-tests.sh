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
API_PID=$!

# Wait for API to start
sleep 5

# Run tests
echo "🧪 Running integration tests..."
npm run test:integration

# Cleanup
echo "🧹 Cleaning up..."
kill $API_PID
docker-compose -f docker-compose.test.yml down

echo "✅ Tests complete!"
