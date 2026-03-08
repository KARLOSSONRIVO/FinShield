param(
    [switch]$SkipDockerPull,
    [switch]$SkipSeed,
    [int]$MaxScanMins = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ZAP_IMAGE       = "ghcr.io/zaproxy/zaproxy:stable"
$SCRIPT_DIR      = $PSScriptRoot
$ENV_FILE        = Join-Path $SCRIPT_DIR ".env"
$REPORTS_DIR     = Join-Path $SCRIPT_DIR "reports"
$BACKEND_DIR     = Join-Path (Split-Path $SCRIPT_DIR -Parent) "BACKEND"
$MONGO_CONTAINER = "finshield-mongo-zap"

function Write-Step($msg) { Write-Host "`n[ZAP] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK  $msg"  -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  ERR $msg"  -ForegroundColor Red }

# 1. Prerequisites
Write-Step "Checking prerequisites..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fail "Docker is not installed or not in PATH."
    exit 1
}
try { docker info 2>&1 | Out-Null; Write-Ok "Docker is running" }
catch { Write-Fail "Docker is not running."; exit 1 }

if (-not (Test-Path $ENV_FILE)) {
    Write-Fail ".env not found. Copy .env.example to .env and fill in values."
    exit 1
}

# 2. Load .env
Write-Step "Loading .env..."
Get-Content $ENV_FILE |
    Where-Object { $_ -match '^\s*[^#\s]' -and $_ -match '=' } |
    ForEach-Object {
        $parts = $_ -split '=', 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }

$TARGET_URL     = $env:TARGET_URL
$ADMIN_EMAIL    = $env:ZAP_ADMIN_EMAIL
$ADMIN_PASSWORD = $env:ZAP_ADMIN_PASSWORD

if (-not $TARGET_URL -or -not $ADMIN_EMAIL -or -not $ADMIN_PASSWORD) {
    Write-Fail "Missing required vars: TARGET_URL, ZAP_ADMIN_EMAIL, ZAP_ADMIN_PASSWORD"
    exit 1
}
Write-Ok "Target (ZAP): $TARGET_URL"

# Build a localhost URL for host-side HTTP calls (host.docker.internal is Docker-only)
$LOCAL_URL = $TARGET_URL -replace 'host\.docker\.internal', 'localhost'
Write-Ok "Local check URL: $LOCAL_URL"

# 3. Start local MongoDB and run seeders (unless -SkipSeed)
if (-not $SkipSeed) {
    Write-Step "Starting local MongoDB container ($MONGO_CONTAINER)..."
    $existing = docker ps -a --filter "name=$MONGO_CONTAINER" --format "{{.Names}}" 2>&1
    if ($existing -match $MONGO_CONTAINER) {
        Write-Ok "Container already exists - removing and recreating..."
        docker rm -f $MONGO_CONTAINER | Out-Null
    }
    docker run -d --name $MONGO_CONTAINER -p 27017:27017 mongo:7 | Out-Null
    Write-Ok "MongoDB started on port 27017"

    Write-Host "  Waiting 5s for MongoDB to be ready..."
    Start-Sleep -Seconds 5

    Write-Step "Running seeders against local MongoDB..."
    Push-Location $BACKEND_DIR
    try {
        node src/seeders/full-system.seeder.js
        Write-Ok "full-system seeder complete"
        node src/seeders/hamish-policies.seeder.js
        Write-Ok "hamish-policies seeder complete"
    } catch {
        Write-Fail "Seeder failed: $_"
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Step "Skipping seed (-SkipSeed flag set)"
}

# 4. Verify API is reachable
Write-Step "Checking API health at $LOCAL_URL/health ..."
try {
    Invoke-RestMethod -Uri "$LOCAL_URL/health" -Method GET -TimeoutSec 10 | Out-Null
    Write-Ok "API is reachable"
} catch {
    Write-Fail "Cannot reach $LOCAL_URL/health - is the backend running?"
    exit 1
}

# 5. Obtain JWT Bearer token
Write-Step "Authenticating as $ADMIN_EMAIL ..."
$loginBody = @{ email = $ADMIN_EMAIL; password = $ADMIN_PASSWORD } | ConvertTo-Json -Compress
try {
    $loginResp = Invoke-RestMethod `
        -Uri "$LOCAL_URL/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"

    if ($loginResp.data -and $loginResp.data.accessToken) {
        $token = $loginResp.data.accessToken
    } elseif ($loginResp.accessToken) {
        $token = $loginResp.accessToken
    } else {
        $token = $loginResp.token
    }
    if (-not $token) { throw "accessToken not found in login response" }
    Write-Ok "Bearer token obtained"
} catch {
    Write-Fail "Login failed: $_"
    Write-Host "  Check ZAP_ADMIN_EMAIL / ZAP_ADMIN_PASSWORD in .env"
    exit 1
}

# 6. Pull ZAP image
if (-not $SkipDockerPull) {
    Write-Step "Pulling ZAP Docker image ($ZAP_IMAGE) ..."
    docker pull $ZAP_IMAGE
    Write-Ok "Image ready"
}

# 7. Prepare reports directory
New-Item -ItemType Directory -Force -Path $REPORTS_DIR | Out-Null
$dockerScriptDir  = $SCRIPT_DIR  -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'
$dockerReportsDir = $REPORTS_DIR -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'

# 8. Run ZAP
Write-Step "Starting ZAP scan (max $MaxScanMins min active scan)..."
Write-Host "  Results will be saved to: $REPORTS_DIR"

docker run --rm `
    -v "${dockerScriptDir}:/zap/wrk:ro" `
    -v "${dockerReportsDir}:/zap/results" `
    -e "TARGET_URL=$TARGET_URL" `
    -e "ZAP_BEARER_TOKEN=$token" `
    --add-host=host.docker.internal:host-gateway `
    $ZAP_IMAGE `
    zap.sh -cmd -autorun /zap/wrk/zap.yaml

$exitCode = $LASTEXITCODE

# 9. Results
Write-Host ""
Write-Step "Scan complete (exit code: $exitCode)"

$htmlReport = Join-Path $REPORTS_DIR "finshield-zap-report.html"
$jsonReport = Join-Path $REPORTS_DIR "finshield-zap-report.json"

if (Test-Path $htmlReport) {
    Write-Ok "HTML report: $htmlReport"
    Write-Ok "JSON report: $jsonReport"
    Write-Host "`n  Opening report in browser..."
    Start-Process $htmlReport
} else {
    Write-Host "  [!] HTML report not found - check Docker output above for errors."
}

exit $exitCode