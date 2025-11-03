Repository quick-guide for AI coding agents

Keep this short: focus on repo-specific patterns, build/run commands, and places to read before changing behavior.

- Big picture
  - Monorepo-like layout: `BackEnd/` (Express + Sequelize + MySQL) and `frontend-new/` (React + Vite). Top-level contains docker-compose for local compose runs.
  - Backend entry: `BackEnd/src/server.js`. It registers routes from `BackEnd/src/routes/*`, initializes Socket.IO (`BackEnd/src/config/socket.js`) and runs DB sync/bootstrap.
  - ORM: Sequelize models live in `BackEnd/src/models/*.js`. DB connection is in `BackEnd/src/config/db.js` (reads env vars DB_NAME/DB_USER/DB_PASS/DB_HOST).

- Important runtime behavior to preserve
  - Server performs `sequelize.sync({ alter: true })` in `server.js` and also uses top-level `await sequelize.sync(...)` in `db.js` — be careful when changing sync behavior (migrations are not used).
  - On first run the app bootstraps a default company/role/user and inserts Modules via `BackEnd/src/utils/bootstrapSystemSuperAdmin.js`. This file: creates a default admin email, inserts hardcoded Module rows and sends an email via `sendEmail`.
  - Permissions enforcement happens via middleware: `BackEnd/src/middlewares/authMiddlewares.js` (expects JWT in Authorization header) and `BackEnd/src/middlewares/permissionsMiddlewares.js` (expects moduleId as a route param and `req.user.role`). Many routes require `:moduleId` in the path.

- Frontend specifics
  - Vite app in `frontend-new/`. Entry `frontend-new/src/main.jsx`, router+pages in `frontend-new/src/App.jsx`.
  - API base URL is read from Vite env `VITE_BASE_API_URL` in `frontend-new/src/utils/Constants.js`. Axios instance (`frontend-new/src/services/axiosinstance.js`) uses this and automatically attaches `Authorization: Bearer <jwtToken>` from `localStorage` key `jwtToken`.

- Common dev commands (from package.json)
  - Backend: run in dev: `cd BackEnd && npm run dev` (starts `node --watch src/server.js`, default PORT 5000). Ensure `.env` contains DB_NAME, DB_USER, DB_PASS, DB_HOST, JWT_SECRET, and mail settings if `sendEmail` is enabled.
  - Frontend: run dev server: `cd frontend-new && npm run dev` (Vite, default port 3000). Set `VITE_BASE_API_URL` in `.env` or use `--mode` to override.
  - Docker: see `docker-compose.yml` at repo root for containerized setup (may require env file adjustments).

- Patterns & gotchas for edits
  - Routes expect `:moduleId` as first param for many resources (see `BackEnd/src/routes/*.js`). Don't remove or change signature without updating permission checks.
  - Roles/permissions use UUID module IDs (length ~36). Middleware validates UUID-like length — use real UUIDs when writing tests or seed data.
  - Database sync is currently used instead of migrations. Avoid large schema changes without introducing migrations or careful sync strategies.
  - Bootstrapping inserts production-looking defaults (including sending emails). When testing locally, either mock `sendEmail` or set safe env values.

- Files to read first when changing features
  - Backend entry & config: `BackEnd/src/server.js`, `BackEnd/src/config/db.js`, `BackEnd/src/config/constants.js`
  - Auth & permissions: `BackEnd/src/middlewares/authMiddlewares.js`, `BackEnd/src/middlewares/permissionsMiddlewares.js`
  - Bootstrapping/seed: `BackEnd/src/utils/bootstrapSystemSuperAdmin.js`
  - Frontend API wiring: `frontend-new/src/services/axiosinstance.js`, `frontend-new/src/utils/Constants.js`

If anything here is unclear or you'd like the instructions expanded/shortened, tell me what to change and I will iterate.
