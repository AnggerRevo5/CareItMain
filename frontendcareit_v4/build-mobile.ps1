# Build script for mobile (Windows PowerShell)
# This enables static export for Capacitor
# Temporarily moves API routes out of the way during build

$apiPath = "src\app\api"
$apiBackupPath = "src\app\_api_backup"

# Check if API folder exists
if (Test-Path $apiPath) {
    Write-Host "Temporarily moving API routes out of the way..." -ForegroundColor Yellow
    
    # Remove backup if exists
    if (Test-Path $apiBackupPath) {
        Remove-Item -Recurse -Force $apiBackupPath
    }
    
    # Move API folder to backup location
    Move-Item -Path $apiPath -Destination $apiBackupPath
    Write-Host "API routes moved to backup location" -ForegroundColor Green
}

try {
    $env:NEXT_EXPORT = "true"
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        npx cap sync
    } else {
        Write-Host "Build failed, skipping Capacitor sync" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    # Restore API routes after build
    if (Test-Path $apiBackupPath) {
        Write-Host "Restoring API routes..." -ForegroundColor Yellow
        if (Test-Path $apiPath) {
            Remove-Item -Recurse -Force $apiPath
        }
        Move-Item -Path $apiBackupPath -Destination $apiPath
        Write-Host "API routes restored" -ForegroundColor Green
    }
}

