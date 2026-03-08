#!/usr/bin/env bash
# ============================================================
#  FinShield ZAP Security Scan — Linux / macOS runner
#  Usage:
#    chmod +x run-zap.sh
#    ./run-zap.sh
#    ./run-zap.sh --skip-pull
# ============================================================
set -euo pipefail

ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
REPORTS_DIR="$SCRIPT_DIR/reports"
SKIP_PULL=false

for arg in "$@"; do
  [[ "$arg" == "--skip-pull" ]] && SKIP_PULL=true
done

# ── Helpers ───────────────────────────────────────────────────────────────────
step() { echo -e "\n\033[36m[ZAP] $1\033[0m"; }
ok()   { echo -e "  \033[32m✅ $1\033[0m"; }
fail() { echo -e "  \033[31m❌ $1\033[0m"; exit 1; }

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
step "Checking prerequisites..."

command -v docker &>/dev/null || fail "Docker is not installed."
docker info &>/dev/null       || fail "Docker daemon is not running."
ok "Docker is running"

[[ -f "$ENV_FILE" ]] || fail ".env not found. Copy .env.example to .env and fill in values."

# ── 2. Load .env ──────────────────────────────────────────────────────────────
step "Loading .env..."
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${TARGET_URL:?Missing TARGET_URL in .env}"
: "${ZAP_ADMIN_EMAIL:?Missing ZAP_ADMIN_EMAIL in .env}"
: "${ZAP_ADMIN_PASSWORD:?Missing ZAP_ADMIN_PASSWORD in .env}"

# On Linux with --network host, localhost works directly.
# On macOS/Docker Desktop, swap to host.docker.internal.
ok "Target: $TARGET_URL"

# ── 3. Verify API is reachable ────────────────────────────────────────────────
step "Checking API health at $TARGET_URL/health ..."
curl -sf "$TARGET_URL/health" >/dev/null \
  || fail "Cannot reach $TARGET_URL/health — is the backend running?"
ok "API is reachable"

# ── 4. Obtain JWT Bearer token ────────────────────────────────────────────────
step "Authenticating as $ZAP_ADMIN_EMAIL ..."

LOGIN_RESPONSE=$(curl -sf -X POST "$TARGET_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ZAP_ADMIN_EMAIL\",\"password\":\"$ZAP_ADMIN_PASSWORD\"}") \
  || fail "Login request failed. Check your credentials in .env."

# Try data.accessToken first, fall back to accessToken
ZAP_BEARER_TOKEN=$(echo "$LOGIN_RESPONSE" | \
  python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('data',r).get('accessToken', r.get('token','')))" 2>/dev/null)

[[ -n "$ZAP_BEARER_TOKEN" ]] || fail "Could not extract accessToken from login response."
ok "Bearer token obtained"
export ZAP_BEARER_TOKEN

# ── 5. Pull ZAP image ─────────────────────────────────────────────────────────
if [[ "$SKIP_PULL" == "false" ]]; then
  step "Pulling ZAP Docker image ($ZAP_IMAGE) ..."
  docker pull "$ZAP_IMAGE"
  ok "Image ready"
fi

# ── 6. Prepare reports directory ─────────────────────────────────────────────
mkdir -p "$REPORTS_DIR"

# ── 7. Run ZAP ────────────────────────────────────────────────────────────────
step "Starting ZAP scan..."
echo "  Results will be saved to: $REPORTS_DIR"

# --network host lets ZAP (in Docker) reach localhost on Linux.
# On macOS, replace TARGET_URL in .env with http://host.docker.internal:PORT
docker run --rm \
  -v "$SCRIPT_DIR:/zap/wrk:ro" \
  -v "$REPORTS_DIR:/zap/results" \
  -e "TARGET_URL=$TARGET_URL" \
  -e "ZAP_BEARER_TOKEN=$ZAP_BEARER_TOKEN" \
  --network host \
  --add-host=host.docker.internal:host-gateway \
  "$ZAP_IMAGE" \
  zap.sh -cmd -autorun /zap/wrk/zap.yaml

ZAP_EXIT=$?

# ── 8. Results summary ────────────────────────────────────────────────────────
echo ""
step "Scan complete (exit code: $ZAP_EXIT)"

HTML_REPORT="$REPORTS_DIR/finshield-zap-report.html"
JSON_REPORT="$REPORTS_DIR/finshield-zap-report.json"

if [[ -f "$HTML_REPORT" ]]; then
  ok "HTML report: $HTML_REPORT"
  ok "JSON report: $JSON_REPORT"

  # Open in browser if available
  if command -v xdg-open &>/dev/null; then
    xdg-open "$HTML_REPORT" &
  elif command -v open &>/dev/null; then
    open "$HTML_REPORT"
  fi
else
  echo "  ⚠️  HTML report not found — check Docker output above for errors."
fi

exit $ZAP_EXIT
