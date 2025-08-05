#!/bin/bash

# Deploy Serverless Functions for VM Orchestrator
# This script deploys the serverless functions to AWS

set -e

echo "🚀 Deploying VM Orchestrator Serverless Functions"

ENV_FILE="./serverless/.env"
source $ENV_FILE

# Check if we're in the right directory
if [ ! -f "serverless/serverless.yml" ]; then
    echo "❌ Error: serverless/serverless.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if AWS credentials are configured
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
fi

# Check if .env file exists
if [ ! -f "./serverless/.env" ]; then
    echo "⚠️  Warning: .env file not found. Using default values."
    echo "   Consider copying .env.sample to .env and configuring your settings."
fi

# Navigate to serverless directory
cd serverless

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing serverless dependencies..."
    npm install
fi

# Check if serverless is installed globally, if not install it locally
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Copy .env file to serverless directory if it doesn't exist
if [ ! -f "$ENV_FILE" ] && [ -f "../.env" ]; then
    echo "📋 Copying .env file to serverless directory..."
    cp ../.env $ENV_FILE
fi

# Deploy the serverless functions
echo "🚀 Deploying serverless functions..."
serverless deploy --verbose

# Get the deployed API endpoint
echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Note the API Gateway endpoint URL from the output above"
echo "2. Update your main application's .env file with SERVERLESS_API_URL"
echo "3. Test the API endpoints using the URLs shown above"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: cd serverless && npm run logs -- vmsApi"
echo "  - Remove deployment: cd serverless && npm run remove"
echo "  - Redeploy: cd serverless && npm run deploy"
