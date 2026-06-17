@echo off
echo Starting Meridian AI Platform...

echo Starting Backend API Server (Port 8000)...
start "Meridian Backend" cmd /k "cd backend && .\venv\Scripts\activate && python -m uvicorn app.main:app --port 8000 --reload"

echo Starting Frontend Dev Server (Port 5173)...
start "Meridian Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting in new windows!
echo Once loaded, the app will be available at http://localhost:5173
pause
