@echo off
echo ===================================================
echo   ExamForge FastAPI Backend Setup ^& Launch
echo ===================================================
cd /d "%~dp0"

IF NOT EXIST ".venv" (
    echo [1/4] Creating Python virtual environment (.venv)...
    python -m venv .venv
)

echo [2/4] Activating virtual environment...
call .venv\Scripts\activate

echo [3/4] Checking and installing dependencies...
pip install -r requirements.txt

echo [4/4] Seeding pilot examination authority database...
python seed_v10_authority_pilot.py

echo.
echo Starting FastAPI Uvicorn Server on http://localhost:8000 ...
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
