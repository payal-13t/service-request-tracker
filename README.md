# Service Request Tracker

A full-stack internal service desk prototype built with React + Vite, Flask REST APIs and SQLite.

## Dashboard features
- Summary cards for total, open, in-progress (pending), and resolved requests
- Status breakdown donut chart and priority distribution bars
- Create service requests with title, description and priority validation
- Update request status from the requests table
- Search by title/description and filter by status or priority
- Responsive sidebar navigation and mobile-friendly layout

## Requirements
- Python 3.9+
- Node.js 20.19+ (Node 22 is supported)
- npm

## Run on Windows (VS Code)

### 1. Backend
Open a terminal in the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000`. Keep this terminal open.
If PowerShell blocks activation, use Command Prompt and run `venv\Scripts\activate.bat`.

### 2. Frontend
Open a second terminal in VS Code:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

### 3. Verify
- API health: `http://127.0.0.1:5000/api/health`
- Frontend: `http://localhost:5173`
- Backend tests: from `backend`, activate `venv` and run `pytest -q`.

## API
- `GET /api/health`
- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/<id>`

## Status meaning
The dashboard's **Pending requests** summary counts records with status `In Progress`. The request workflow retains the API's existing statuses: `Open`, `In Progress`, and `Resolved`.

## Notes
This is a local prototype using SQLite. Authentication, authorization, audit history, deployment hardening and production WSGI serving are not implemented. Review and secure the application before production use.
