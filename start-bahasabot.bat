@echo off
echo Starting BahasaBot...

start "BahasaBot Backend" /min cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
start "BahasaBot Frontend" /min cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend starting at http://localhost:8000
echo Frontend starting at http://localhost:3000
