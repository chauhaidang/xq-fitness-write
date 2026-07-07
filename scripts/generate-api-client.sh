#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for service name parameter
if [ -z "$1" ]; then
  echo -e "${RED}❌ Service name is required${NC}"
  echo -e "${YELLOW}Usage: $0 <service-name>${NC}"
  echo -e "${YELLOW}Example: $0 write-service${NC}"
  echo ""
  echo -e "${BLUE}Available services:${NC}"
  echo -e "  - write-service (api/write-service-api.yaml)"
  echo -e "  - read-service  (api/read-service-api.yaml) [future]"
  exit 1
fi

SERVICE_NAME="$1"

echo -e "${BLUE}🔧 Generating TypeScript API Client for ${YELLOW}${SERVICE_NAME}${BLUE}...${NC}"

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_FILE="$PROJECT_ROOT/api/${SERVICE_NAME}-api.yaml"
OUTPUT_DIR="$PROJECT_ROOT/generated-clients/${SERVICE_NAME}"
# Extract service prefix (e.g., "write-service" -> "write")
SERVICE_PREFIX="${SERVICE_NAME%-service}"
PACKAGE_NAME="xq-fitness-${SERVICE_PREFIX}-client"

# Validate spec exists
if [ ! -f "$SPEC_FILE" ]; then
  echo -e "${RED}❌ OpenAPI spec not found: $SPEC_FILE${NC}"
  echo -e "${YELLOW}Expected location: api/${SERVICE_NAME}-api.yaml${NC}"
  exit 1
fi

# Client generation is a bootstrap step, so it must work before dependencies are installed.
if command -v npm &> /dev/null; then
  NPM_COMMAND=(npm)
else
  echo -e "${RED}❌ npm is not available${NC}"
  echo -e "${BLUE}   Install Node.js 20+ with npm, then rerun this script.${NC}"
  exit 1
fi

# Clean previous generation for this service
echo -e "${BLUE}🧹 Cleaning previous generation for ${SERVICE_NAME}...${NC}"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Run the download tool outside this project so Yarn doesn't try to resolve the
# not-yet-generated file dependency before the first install.
BOOTSTRAP_DIR="$(mktemp -d)"
trap 'rm -rf "$BOOTSTRAP_DIR"' EXIT
cp "$PROJECT_ROOT/openapitools.json" "$BOOTSTRAP_DIR/openapitools.json"

# Generate TypeScript client
# Note: Using typescript-fetch generator. Alternative: typescript-axios (has better error handling)
# To use axios instead, change -g to typescript-axios and add axios dependency
echo -e "${BLUE}📝 Generating client code from OpenAPI spec...${NC}"
(cd "$BOOTSTRAP_DIR" \
  && "${NPM_COMMAND[@]}" exec --yes --package @openapitools/openapi-generator-cli@2.25.2 -- openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g typescript-axios \
  -o "$OUTPUT_DIR" \
  --additional-properties=supportsES6=true,npmName=${PACKAGE_NAME},npmVersion=1.0.0)

echo -e "${GREEN}✅ API Client generation complete!${NC}"
echo -e "${GREEN}   Service: ${SERVICE_NAME}${NC}"
echo -e "${GREEN}   Package: ${PACKAGE_NAME}${NC}"
echo -e "${GREEN}   Generated at: $OUTPUT_DIR${NC}"
echo ""
echo -e "${BLUE}Next, install the repository dependencies:${NC}"
echo -e "${YELLOW}  npm ci${NC}"
