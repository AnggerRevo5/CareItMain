@echo off
echo Building CareIt for Windows (Bypassing Signing)...

:: Set environment variables to disable calling winCodeSign
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=

:: Clean previous build
if exist dist rmdir /s /q dist

:: Run build
call npm run electron:build
