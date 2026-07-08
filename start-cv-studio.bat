@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if not errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=(Get-Location).Path; $port=5500; while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $port++ }; Start-Process -FilePath cmd.exe -ArgumentList @('/c', \"set PORT=$port&& node local-server.js\") -WorkingDirectory $root -WindowStyle Hidden; Start-Sleep -Seconds 1; $url=\"http://localhost:$port/app/onboarding.html\"; Start-Process $url; Write-Host \"CV Studio is opening at $url\""
  echo Owner-managed AI uses GEMINI_API_KEY from .env or hosting environment variables.
  endlocal
  exit /b 0
)

where python >nul 2>nul
if errorlevel 1 (
  echo Node.js is recommended to run CV Studio with AI.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=5500; $root=(Get-Location).Path; $isOpen=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if (-not $isOpen) { Start-Process -FilePath python -ArgumentList @('-m','http.server',"$port") -WorkingDirectory $root -WindowStyle Hidden; Start-Sleep -Seconds 1 }; Start-Process 'http://localhost:5500/app/onboarding.html'"

echo CV Studio is opening at http://localhost:5500/app/onboarding.html
echo Warning: Python static server cannot run owner-managed AI. Install Node.js for AI.
endlocal
