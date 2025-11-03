# Developer quickstart — Backend + Frontend (Windows PowerShell examples)

This file contains the minimal commands and environment guidance to run the project locally for development. It assumes you are on Windows (PowerShell) as detected in your environment.

1) Prerequisites
- Node.js (v18+ recommended)
- MySQL server accessible locally or via Docker
- pnpm/npm (this repo contains npm lockfiles; use whichever you prefer)
- (Optional) Docker and docker-compose for containerized local runs

2) Backend (BackEnd)

Set environment variables (PowerShell example):

```powershell
# from project root
Set-Item -Path Env:DB_NAME -Value "qms_db"
Set-Item -Path Env:DB_USER -Value "root"
Set-Item -Path Env:DB_PASS -Value "password"
Set-Item -Path Env:DB_HOST -Value "localhost"
Set-Item -Path Env:JWT_SECRET -Value "a_very_secret_string"
Set-Item -Path Env:VITE_BASE_API_URL -Value "http://localhost:5000/api"
```

Install dependencies and run backend:

```powershell
cd BackEnd
npm install
# dev mode with auto-restart
npm run dev

# or run production server
npm start
```

Notes:
- `server.js` calls `sequelize.sync({ alter: true })` and then `bootstrapSystemSuperAdmin()` — this will attempt to seed modules and a super-admin user. Ensure `BOOTSTRAP_ON_SYNC` and `MAIL_*` environment variables are set appropriately.

3) Frontend (frontend-new)

Set Vite env (PowerShell example):

```powershell
Set-Item -Path Env:VITE_BASE_API_URL -Value "http://localhost:5000/api"
```

Install and run:

```powershell
cd frontend-new
npm install
npm run dev

# build for production
npm run build
```

4) Docker (optional local compose)

If you prefer containerized local dev, edit `docker-compose.yml` at repo root to include proper env or a `.env` file and then:

```powershell
docker compose up --build
```

5) Quick checks
- To test login and API connectivity, use the frontend login page or tools like Postman/curl to call `POST http://localhost:5000/api/auth/login`.
- Check the backend console for DB sync messages: `"✅ Database & tables synced"` and bootstrap logs.

6) Safety tips
- Do not commit `.env` to source control. Use `.env.example` as a template (we added one at project root).
- On production, replace `sequelize.sync({ alter: true })` with a proper migration strategy.
