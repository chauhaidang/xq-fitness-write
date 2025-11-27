#!/bin/bash
# Script to run component tests against DigitalOcean deployment

set -e

echo "🔍 Getting DigitalOcean app URL..."

# Method 4: Prompt user if still not found
if [ -z "$APP_URL" ]; then
  echo "❌ Could not automatically detect app URL."
  echo ""
  echo "Please provide your DigitalOcean app URL."
  echo "You can find it by running:"
  echo "  doctl apps list --format Name,DefaultIngress"
  echo "  or"
  echo "  doctl apps get <app-id> --format DefaultIngress"
  echo ""
  read -p "Enter your app URL (e.g., https://xq-fitness-abc123.ondigitalocean.app): " APP_URL
  
  if [ -z "$APP_URL" ]; then
    echo "❌ Error: App URL is required"
    exit 1
  fi
fi

# Remove trailing slash if present and ensure it starts with http:// or https://
APP_URL="${APP_URL%/}"
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
  APP_URL="https://${APP_URL}"
fi

# Construct API URLs
API_BASE_URL="${APP_URL}/xq-fitness-write-service/api/v1"
HEALTH_CHECK_URL="${APP_URL}/xq-fitness-write-service/health"

echo ""
echo "📋 Test Configuration:"
echo "  App URL: ${APP_URL}"
echo "  API Base URL: ${API_BASE_URL}"
echo "  Health Check URL: ${HEALTH_CHECK_URL}"
echo ""

# Test connectivity first
echo "🔗 Testing connectivity to health endpoint..."
if curl -s -f -o /dev/null --max-time 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
  echo "✅ Health check endpoint is reachable"
else
  echo "⚠️  Warning: Could not reach health check endpoint. Tests may fail."
  echo "   URL: $HEALTH_CHECK_URL"
  read -p "Continue anyway? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi


# Export environment variables and run tests
export API_BASE_URL
export HEALTH_CHECK_URL

npm run test:component

