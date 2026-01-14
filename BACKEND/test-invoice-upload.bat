@echo off
REM Test script for Invoice Upload Endpoint (Windows)
REM Usage: test-invoice-upload.bat [TOKEN] [FILE_PATH]

setlocal

set BASE_URL=%BASE_URL%
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

set TOKEN=%1
if "%TOKEN%"=="" set TOKEN=%TEST_TOKEN%

set FILE_PATH=%2
if "%FILE_PATH%"=="" set FILE_PATH=test-invoice.pdf

echo 🧪 Testing Invoice Upload Endpoint
echo.
echo Base URL: %BASE_URL%
echo Endpoint: POST %BASE_URL%/invoice/upload
echo.

REM Check if token is provided
if "%TOKEN%"=="" (
    echo ❌ ERROR: Token is required
    echo.
    echo Usage:
    echo   test-invoice-upload.bat YOUR_TOKEN [FILE_PATH]
    echo.
    echo Or set environment variable:
    echo   set TEST_TOKEN=your_token_here
    echo   test-invoice-upload.bat
    echo.
    echo To get a token:
    echo   1. Login via POST %BASE_URL%/auth/login
    echo   2. Copy the token from the response
    exit /b 1
)

REM Check if file exists
if not exist "%FILE_PATH%" (
    echo ⚠️  Test file not found: %FILE_PATH%
    echo Creating a dummy test file...
    echo This is a test invoice file for upload testing. > "%FILE_PATH%"
    echo ✅ Created dummy file: %FILE_PATH%
    echo.
)

for %%A in ("%FILE_PATH%") do set FILE_SIZE=%%~zA
echo 📄 File: %FILE_PATH% (%FILE_SIZE% bytes)
echo.

REM Make the request
echo 📤 Sending upload request...
echo.

curl -X POST "%BASE_URL%/invoice/upload" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -F "file=@%FILE_PATH%" ^
  -w "\n\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Request completed successfully!
) else (
    echo.
    echo ❌ Request failed with error code: %ERRORLEVEL%
    exit /b 1
)
