# Build script for Electron (Windows PowerShell)
# This enables static export for Electron
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
    Write-Host "Cleaning cache..." -ForegroundColor Yellow
    # Remove .next folder to clear cache
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
        Write-Host "Cache cleared" -ForegroundColor Green
    }
    
    Write-Host "Building Next.js for Electron..." -ForegroundColor Yellow
    
    # Set environment variables
    $env:ELECTRON_BUILD = "true"
    
    # Set API URL if not already set (bisa diubah sesuai kebutuhan)
    if (-not $env:NEXT_PUBLIC_API_URL) {
        Write-Host "Using default API URL: http://localhost:8081" -ForegroundColor Yellow
        Write-Host "To change API URL, set NEXT_PUBLIC_API_URL environment variable" -ForegroundColor Yellow
        Write-Host "Example: `$env:NEXT_PUBLIC_API_URL='http://31.97.109.192:8081'" -ForegroundColor Cyan
    } else {
        Write-Host "Using API URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Green
    }
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Next.js build successful!" -ForegroundColor Green
        Write-Host "Building Electron installer..." -ForegroundColor Yellow
        npx electron-forge make
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "Build completed successfully!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "Installer location: out\make\" -ForegroundColor Cyan
            Write-Host "`nYou can now distribute the installer file." -ForegroundColor Yellow
        } else {
            Write-Host "Electron build failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Next.js build failed, skipping Electron build" -ForegroundColor Red
    }
} finally {
    # Restore API routes after build
    if (Test-Path $apiBackupPath) {
        Write-Host "`nRestoring API routes..." -ForegroundColor Yellow
        if (Test-Path $apiPath) {
            Remove-Item -Recurse -Force $apiPath
        }
        Move-Item -Path $apiBackupPath -Destination $apiPath
        Write-Host "API routes restored" -ForegroundColor Green
    }
}



