@echo off
REM Build script for Electron (Windows CMD)
REM This enables static export for Electron
REM Temporarily moves API routes out of the way during build

set API_PATH=src\app\api
set API_BACKUP_PATH=src\app\_api_backup

REM Check if API folder exists and move it
if exist "%API_PATH%" (
    echo Temporarily moving API routes out of the way...
    if exist "%API_BACKUP_PATH%" (
        rmdir /s /q "%API_BACKUP_PATH%"
    )
    move "%API_PATH%" "%API_BACKUP_PATH%"
    echo API routes moved to backup location
)

REM Clear cache
if exist ".next" (
    echo Cleaning cache...
    rmdir /s /q ".next"
    echo Cache cleared
)

set ELECTRON_BUILD=true
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo Next.js build successful!
    echo Building Electron installer...
    call npx electron-forge make
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo Build completed successfully!
        echo ========================================
        echo Installer location: out\make\
        echo.
        echo You can now distribute the installer file.
    ) else (
        echo Electron build failed
    )
) else (
    echo Build failed, skipping Electron build
    goto :restore
)

:restore
REM Restore API routes after build
if exist "%API_BACKUP_PATH%" (
    echo.
    echo Restoring API routes...
    if exist "%API_PATH%" (
        rmdir /s /q "%API_PATH%"
    )
    move "%API_BACKUP_PATH%" "%API_PATH%"
    echo API routes restored
)

if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%



