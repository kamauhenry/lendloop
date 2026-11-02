#!/usr/bin/env bash
# One-shot n8n setup: imports workflows and waits for you to create the SMTP credential.
# Run once after `docker compose up -d`.
set -e

N8N=http://localhost:5678
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

echo "Waiting for n8n to be ready..."
until curl -s -o /dev/null -w "%{http_code}" "$N8N/" | grep -q "200\|302"; do
  sleep 2
done
echo "n8n is up."

echo ""
echo "Importing workflows..."
docker exec lendloop-n8n-1 n8n import:workflow --input=/tmp/wf-request.json 2>/dev/null || true
docker cp "$REPO_DIR/n8n/workflow-request-notification.json" lendloop-n8n-1:/tmp/wf-request.json
docker cp "$REPO_DIR/n8n/workflow-overdue-reminders.json"    lendloop-n8n-1:/tmp/wf-overdue.json
docker exec lendloop-n8n-1 n8n import:workflow --input=/tmp/wf-request.json
docker exec lendloop-n8n-1 n8n import:workflow --input=/tmp/wf-overdue.json
docker exec lendloop-n8n-1 n8n publish:workflow --id=a1b2c3d4-e5f6-7890-abcd-ef1234567890
docker exec lendloop-n8n-1 n8n publish:workflow --id=b2c3d4e5-f6a7-8901-bcde-f23456789012
docker restart lendloop-n8n-1 > /dev/null

echo ""
echo "Workflows imported and published."
echo ""
echo "-----------------------------------------------------------"
echo "ONE MANUAL STEP — open http://localhost:5678 then:"
echo "  Credentials → Create credential → SMTP"
echo "  Name:  LendLoop SMTP"
echo "  Host:  host.docker.internal"
echo "  Port:  1025"
echo "  SSL:   OFF"
echo "  (leave User and Password blank)"
echo "  Save"
echo ""
echo "All caught emails appear at http://localhost:8025"
echo "-----------------------------------------------------------"
