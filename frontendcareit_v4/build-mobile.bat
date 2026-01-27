@echo off
REM Build script for mobile (Windows CMD)
REM This enables static export for Capacitor
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

set NEXT_EXPORT=true
call npm run build
if %ERRORLEVEL% EQU 0 (
    call npx cap sync
) else (
    echo Build failed, skipping Capacitor sync
    goto :restore
)

:restore
REM Restore API routes after build
if exist "%API_BACKUP_PATH%" (
    echo Restoring API routes...
    if exist "%API_PATH%" (
        rmdir /s /q "%API_PATH%"
    )
    move "%API_BACKUP_PATH%" "%API_PATH%"
    echo API routes restored
)

if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

