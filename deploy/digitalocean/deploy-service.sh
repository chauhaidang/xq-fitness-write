#!/usr/bin/env bash
set -euo pipefail

# Deploy a single service to DigitalOcean App Platform
# Usage: ./deploy-service.sh [read-service|write-service]

if ! command -v doctl >/dev/null; then
  echo "doctl CLI is required (https://docs.digitalocean.com/reference/doctl/)." >&2
  exit 1
fi

if ! command -v jq >/dev/null; then
  echo "jq is required for parsing DigitalOcean JSON responses." >&2
  exit 1
fi

if ! command -v envsubst >/dev/null; then
  echo "envsubst (gettext) is required to render the App Platform spec template." >&2
  exit 1
fi

: "${DO_TOKEN:?Set DO_TOKEN with a DigitalOcean API token that has write access.}"

SERVICE_NAME="${1:-}"
if [[ -z "$SERVICE_NAME" ]] || [[ ! "$SERVICE_NAME" =~ ^(read-service|write-service)$ ]]; then
  echo "Usage: $0 [read-service|write-service]" >&2
  exit 1
fi

REGION="${REGION:-sgp1}"
APP_NAME="${APP_NAME:-xq-fitness}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
IMAGE_NAME="${IMAGE_NAME:-chauhaidang/xq-fitness-write-service}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GITHUB_REGISTRY_CREDENTIALS="${GITHUB_REGISTRY_CREDENTIALS:-}"

# Source database connection details (from provision-db.sh or environment)
: "${DB_HOST:?Set DB_HOST (run provision-db.sh first or export DB_* variables)}"
: "${DB_PORT:?Set DB_PORT}"
: "${DB_USER:?Set DB_USER}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"
: "${DB_NAME:?Set DB_NAME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SPEC_TEMPLATE="${SCRIPT_DIR}/app-spec.${SERVICE_NAME}.template.yaml"
APP_SPEC_RENDERED="${SCRIPT_DIR}/app-spec.${SERVICE_NAME}.rendered.yaml"

if [[ ! -f "$APP_SPEC_TEMPLATE" ]]; then
  echo "Template file not found: $APP_SPEC_TEMPLATE" >&2
  exit 1
fi

echo ">> Authenticating doctl context"
doctl auth init -t "$DO_TOKEN" >/dev/null

echo ">> Using GitHub Container Registry (ghcr.io)"
echo "   Repository: ghcr.io/${GITHUB_OWNER}/${IMAGE_NAME}"
echo "   Tag: ${IMAGE_TAG}"

export APP_NAME REGION GITHUB_OWNER IMAGE_NAME IMAGE_TAG GITHUB_REGISTRY_CREDENTIALS
export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME

# Construct SPRING_DATASOURCE_URL for read-service (Spring Boot)
if [[ "$SERVICE_NAME" == "read-service" ]]; then
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo "   Constructed SPRING_DATASOURCE_URL for read-service"
fi

echo ">> Rendering App Platform spec -> $APP_SPEC_RENDERED"
envsubst < "$APP_SPEC_TEMPLATE" > "$APP_SPEC_RENDERED"

echo ">> Creating or updating App Platform app ($APP_NAME)"
APP_ID=$(doctl apps list --output json 2>/dev/null | jq -r '.[] | select(.spec.name=="'"$APP_NAME"'") | .id' || echo "")

if [[ -z "$APP_ID" ]]; then
  CREATE_RESPONSE=$(doctl apps create --spec "$APP_SPEC_RENDERED" --output json)
  APP_ID=$(echo "$CREATE_RESPONSE" | jq -r '.app.id // .id // empty')
  echo "   Created new app: $APP_ID"
else
  UPDATE_RESPONSE=$(doctl apps update "$APP_ID" --spec "$APP_SPEC_RENDERED" --output json)
  echo "   Updated app: $APP_ID"
fi

cat <<EOF

App Platform app ready: $APP_ID

Next steps:
1. Check deployment status: doctl apps get $APP_ID
2. View app URL: doctl apps get $APP_ID --format DefaultIngress
3. Monitor logs: doctl apps logs $APP_ID --type run --follow
EOF

