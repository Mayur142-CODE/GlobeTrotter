# ==============================================================================
# GlobeTrotter Backend - Supabase Connection Verifier (PowerShell)
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\test-connection.ps1
# ==============================================================================

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "🌍 GlobeTrotter Backend - Supabase Connection Test" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found at $envFile" -ForegroundColor Red
    Write-Host "   Please copy .env.example to .env and configure your Supabase credentials.`n" -ForegroundColor Yellow
    exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not ($line.StartsWith("#"))) {
        $parts = $line -split "=", 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            $envVars[$key] = $val
        }
    }
}

$supabaseUrl = $envVars["SUPABASE_URL"]
if (-not $supabaseUrl) { $supabaseUrl = $env:SUPABASE_URL }

$supabaseAnonKey = $envVars["SUPABASE_ANON_KEY"]
if (-not $supabaseAnonKey) { $supabaseAnonKey = $env:SUPABASE_ANON_KEY }

if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    Write-Host "❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env" -ForegroundColor Red
    exit 1
}

if ($supabaseUrl -like "*your-project-id*" -or $supabaseAnonKey -like "*your-supabase-anon-public-key*") {
    Write-Host "⚠️  Placeholder credentials detected in backend/.env" -ForegroundColor Yellow
    Write-Host "   Please update backend/.env with your real Supabase project credentials.`n" -ForegroundColor Yellow
    Write-Host "   Current URL: $supabaseUrl"
    exit 1
}

$cleanUrl = $supabaseUrl.TrimEnd('/')
$headers = @{
    "apikey" = $supabaseAnonKey
    "Authorization" = "Bearer $supabaseAnonKey"
}

Write-Host "📡 Testing connection to: $cleanUrl ...`n" -ForegroundColor Gray

try {
    # Test Auth health endpoint
    $healthEndpoint = "$cleanUrl/auth/v1/health"
    $healthResp = Invoke-RestMethod -Uri $healthEndpoint -Headers $headers -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Supabase Auth Service: REACHABLE (Status: OK)" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Auth Service Check: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    # Test Auth Settings endpoint (validates anon key)
    $settingsEndpoint = "$cleanUrl/auth/v1/settings"
    $settingsResp = Invoke-RestMethod -Uri $settingsEndpoint -Headers $headers -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Supabase API Credentials: VALIDATED (Anon key verified)" -ForegroundColor Green
    Write-Host "`n🎉 SUCCESS: Local backend successfully connected to your Supabase project!" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Unauthorized) {
        Write-Host "❌ Supabase API: 401 Unauthorized. Verify that SUPABASE_ANON_KEY in .env is correct." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "❌ Connection error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Please verify that your SUPABASE_URL is correct and internet connection is active." -ForegroundColor Yellow
        exit 1
    }
}
