#!/usr/bin/env bash
set -euo pipefail

# Load local .env if present (gitignored)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-northeast1}"
TAG="$(date +%Y%m%d-%H%M%S)"

if [ -z "${PROJECT_ID}" ]; then
  echo "Error: GCP_PROJECT_ID is not set. Copy .env.example to .env and set GCP_PROJECT_ID." >&2
  exit 1
fi

echo "Deploying Takesato Textbook Digital to Cloud Run..."
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "  Tag:     ${TAG}"

gcloud builds submit \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config=cloudbuild.yaml \
  --substitutions="_TAG=${TAG}" \
  .
