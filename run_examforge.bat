@echo off
echo ===================================================
echo   Starting ExamForge Zero-Trust Platform (v1.0)
echo ===================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "ExamForge Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "ExamForge Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both services are launching in separate windows!
echo   - Main Application       : http://localhost:3000
echo   - Student Portal         : http://localhost:3000/candidate
echo   - Messaging & DLT Console: http://localhost:3000/institution-settings
echo   - Backend API Docs       : http://localhost:8000/docs
echo   - Hackathon Demo         : http://localhost:3000/demo
echo ===================================================
pause
