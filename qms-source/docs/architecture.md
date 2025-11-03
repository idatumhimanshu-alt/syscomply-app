# QMS — Detailed Architecture & Walkthrough

Version: 2025-10-30

This document explains how the application is organized, how the major pieces interact at runtime, where to change behavior, and recommended safe next steps. It expands the quick summary into a developer-focused reference.

## Big picture
- Monorepo-like layout:
  - `BackEnd/` — Express API server written in modern ES modules using Sequelize ORM (MySQL).
  - `frontend-new/` — React SPA built with Vite and Material UI.
  - Top-level files: `docker-compose.yml` for containerized local runs, `uploads/` for static file storage served by backend.

The backend provides a REST API mounted under `/api/*`. The frontend calls these endpoints via an Axios instance (`frontend-new/src/services/axiosinstance.js`). Socket.IO provides real-time notifications.

---

## Backend internals (BackEnd/)

### Entrypoint
- `BackEnd/src/server.js` — application bootstrap sequence:
  1. Loads `.env` via `dotenv`.
  2. Creates Express app and HTTP server used by Socket.IO.
  3. Initializes Socket.IO with `initSocket(server, { cors: { origin: '*' }})` (file: `BackEnd/src/config/socket.js`).
  4. Registers middleware: `express.json()`, `express.urlencoded()`, `cors()`, and `bodyParser.json()` (redundant — keep only `express.json()`).
  5. Mounts routers for each resource under `/api/*` (see `BackEnd/src/routes/*`).
  6. Serves static uploads via `app.use('/api/uploads', express.static('uploads'))`.
  7. Calls `sequelize.sync({ alter: true })` and then `bootstrapSystemSuperAdmin()` if sync succeeds.
  8. Starts listening on `process.env.PORT || 5000`.

Notes:
- `server.js` performs the canonical sync + bootstrap. Avoid duplicating `sync()` elsewhere.

### Database layer
- `BackEnd/src/config/db.js` — creates a Sequelize instance configured using env vars (`DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`). Current behavior: it calls `await sequelize.sync({ force: false, hooks: true })` at module load. This duplicates the `sync` in `server.js`. Recommended: remove module-level sync and let `server.js` orchestrate sync/bootstrap.

### Models
- `BackEnd/src/models/*.js` — each file defines a Sequelize model and associations. Important models:
  - `User.js` — user accounts (includes `password_hash` field).
  - `Role.js` and `RoleModulesPermissions.js` — permission-centered model: roles map to module-level permissions (can_read/can_write/can_delete).
  - `Module.js` — registry of application modules/features; bootstrap seeds this table with UUIDs that the frontend uses when calling module-specific routes.
  - `Task`, `TaskAssignment`, `TaskChangeLog` — core task workflow models.

When changing models: prefer migrations (Sequelize CLI or Umzug) in production over `sync({ alter: true })`.

### Routes & Controllers
- `BackEnd/src/routes/*` mount endpoints and chain middlewares. Many routes structurally expect `/:moduleId` as the first param (for permission checks). Example: `router.post('/:moduleId', authenticateUser, checkPermission('write'), userController.createUser)`.
- `BackEnd/src/controllers/*Controller.js` contains business logic and interacts with models. Controllers typically return JSON and status codes.

### Middlewares
- `BackEnd/src/middlewares/authMiddlewares.js` — extracts JWT from `Authorization` header (`Bearer <token>`), verifies using `JWT_SECRET`, and attaches decoded user to `req.user`.
- `BackEnd/src/middlewares/permissionsMiddlewares.js` — `checkPermission(action)` reads `req.user.role` and `req.params.moduleId`, then queries `RoleModulePermission` to ensure the role has permission for that module and action (read/write/delete).

Important conventions:
- The frontend must pass `moduleId` to routes so the middleware can enforce module-level permissions.
- The JWT payload must contain `role` (role ID) for permission checks to work.

### Utilities & Bootstrapping
- `BackEnd/src/utils/bootstrapSystemSuperAdmin.js` — runs after DB sync. If the DB is empty it:
  - Creates default company `IDATUM`.
  - Creates `System Super Admin` role and a default user with a generated password.
  - Inserts hardcoded `Module` rows (with UUIDs used across the app).
  - Assigns full permissions for the super-admin role.
  - Sends credentials by email using `sendEmail()`.

Security note: bootstrap currently writes plaintext password into `password_hash` and logs/email it. Fix: hash password with bcrypt before saving and gate email sending behind env vars.

### Socket.IO
- Server-side: `BackEnd/src/config/socket.js` sets up event channels for notifications and possibly task updates.
- Client-side: frontend connects via `socket.io-client` and listens for notification events.

### Uploads
- Routes that accept files use `multer` for parsing and write files to `uploads/`. The backend serves these files statically under `/api/uploads`.

---

## Frontend internals (frontend-new/)

### Entrypoint & layout
- `frontend-new/src/main.jsx` — mounts the app and wraps it in the MUI controller provider.
- `frontend-new/src/App.jsx` — central router and layout. It conditionally shows `Sidebar` and `Header` and registers many routes: onboarding (company), dashboard, roles/modules/users, tasks, iterations, documents, departments.

### API client & env
- `frontend-new/src/utils/Constants.js` — exports `BASE_API_URL` from `import.meta.env.VITE_BASE_API_URL`.
- `frontend-new/src/services/axiosinstance.js` — axios instance with `baseURL: BASE_API_URL` and request interceptor that attaches `Authorization: Bearer <jwtToken>` where `jwtToken` is read from `localStorage`.

Flow: login returns JWT → frontend stores it in `localStorage.jwtToken` → axios attaches it to subsequent requests → protected backend endpoints validate JWT and set `req.user`.

### Routing conventions
- Many routes pass `moduleId` in the URL when calling backend APIs (the frontend must fetch and propagate module UUIDs when performing module-scoped actions).

### Theming & components
- The app uses Material UI with custom theme wrappers under `src/assets/theme` and `src/assets/theme-dark`.
- UI components are organized under `src/Components` and pages under `src/pages/*`.

---

## Key runtime sequences (concise)

1. Start server: `node src/server.js` (or `npm run dev` → `node --watch src/server.js`). Server calls `sequelize.sync({ alter: true })` then `bootstrapSystemSuperAdmin()` and starts listening.
2. Frontend: Vite dev server (`npm run dev`) serves SPA; it uses `VITE_BASE_API_URL` to reach the backend.
3. Login: frontend posts credentials to `/api/auth/login` → backend verifies and returns a JWT → frontend stores JWT in `localStorage`.
4. Protected API calls: axios automatically adds `Authorization` header → backend `authenticateUser` verifies token → `checkPermission` validates `req.user.role` vs `moduleId` param.

---

## Security & maintenance recommendations (actionable)

High priority
- Hash bootstrap password before storing. Example fix:

```js
const plainPassword = generateRandomPassword();
const passwordHash = await bcrypt.hash(plainPassword, 10);
await User.create({ ..., password_hash: passwordHash });
```

- Prevent logging/emailing plaintext credentials by gating `sendEmail()` behind `process.env.MAIL_HOST` and `process.env.BOOTSTRAP_ON_SYNC`.
- Remove `await sequelize.sync(...)` from `BackEnd/src/config/db.js` to avoid duplicate sync calls.
- Replace `moduleId.length < 36` checks with a proper UUID validator: `import { validate as isUuid } from 'uuid'; if (!isUuid(moduleId)) return res.status(403)...`.

Medium priority
- Replace `body-parser` usage with built-in `express.json()` only.
- Reduce console.log of decoded JWT in production.
- Add `.env.example` (done) and shift to migrations for schema changes.

Low priority
- Add tests for auth and permission middleware.
- Add CI job to run lints and unit tests.

---

## Files to read before making changes
- `BackEnd/src/server.js` — entrypoint, sync & bootstrap.
- `BackEnd/src/config/db.js` — DB connection (remove sync here).
- `BackEnd/src/utils/bootstrapSystemSuperAdmin.js` — seeding & email behavior.
- `BackEnd/src/middlewares/authMiddlewares.js` and `permissionsMiddlewares.js` — authentication and permissions.
- `frontend-new/src/services/axiosinstance.js` and `frontend-new/src/utils/Constants.js` — frontend API wiring.

## Suggested small PRs (safe, prioritized)
1. Hash bootstrap password, stop logging it, and send email only if MAIL_* envs configured. (High impact, low disruption)
2. Remove module-level `sync()` from `BackEnd/src/config/db.js`. (Low risk)
3. Use `uuid.validate()` for moduleId checks. (Low risk)
4. Add `.env.example` and short README with dev commands. (Documentation)

---

If you want, I can create PR patches for 1–3 and run a quick smoke test; tell me whether I should run commands in this environment or just prepare patches for you to review.
