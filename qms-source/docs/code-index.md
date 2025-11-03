# Code-only file index (project-wide)

This file lists all code files (extensions: .js, .jsx, .json, .css, .html) in the repository with a one-line description inferred from the path/name. Use this as a quick inventory when navigating the codebase.

Generated: 2025-10-30

---

## Summary
- BackEnd: 118 code files
- frontend-new: 209 code files

## BackEnd (118 files)

Note: backend is an Express + Sequelize API server. Descriptions are inferred from filenames.

- `BackEnd/package.json` — Backend package manifest and scripts (dev/start).
- `BackEnd/package-lock.json` — Lockfile for backend dependencies.
- `BackEnd/src/server.js` — Express server entrypoint: middleware, routes, Socket.IO init, DB sync and bootstrap.

### BackEnd - config
- `BackEnd/src/config/db.js` — Sequelize DB connection and (currently) a module-level sync call.
- `BackEnd/src/config/socket.js` — Socket.IO initialization logic and event wiring.
- `BackEnd/src/config/constants.js` — Application-wide constant lists (status, priorities, weights).

### BackEnd - models (Sequelize)
- `BackEnd/src/models/Company.js` — Company model (company table).
- `BackEnd/src/models/Document.js` — Document model (uploaded documents metadata).
- `BackEnd/src/models/GeneralDocumentFolder.js` — Folder model for general documents.
- `BackEnd/src/models/GeneralDocument.js` — GeneralDocument model (generic docs feature).
- `BackEnd/src/models/Comment.js` — Comment model for comments on tasks/docs.
- `BackEnd/src/models/Department.js` — Department model.
- `BackEnd/src/models/User.js` — User model (users, password_hash etc.).
- `BackEnd/src/models/TaskChangeLog.js` — Task change log model.
- `BackEnd/src/models/TaskAssignment.js` — Task assignment model linking users to tasks.
- `BackEnd/src/models/Task.js` — Task model (business tasks/controls).
- `BackEnd/src/models/RoleModulesPermissions.js` — Role-to-module permissions mapping model.
- `BackEnd/src/models/Role.js` — Role model (user role definitions).
- `BackEnd/src/models/Notification.js` — Notification model (in-app notifications).
- `BackEnd/src/models/Module.js` — Module model (feature/module registry; used in permissions).
- `BackEnd/src/models/Iteration.js` — Iteration model (task iterations/versioning).

### BackEnd - controllers
- `BackEnd/src/controllers/authController.js` — Authentication controller: login/register/token issuance.
- `BackEnd/src/controllers/generalDocumentController.js` — Controller for general documents CRUD.
- `BackEnd/src/controllers/iterationController.js` — Iteration-related endpoints handling.
- `BackEnd/src/controllers/documentController.js` — Document upload/management controller.
- `BackEnd/src/controllers/departmentController.js` — Department CRUD controller.
- `BackEnd/src/controllers/companyController.js` — Company CRUD controller and onboarding endpoints.
- `BackEnd/src/controllers/commentController.js` — Comment create/read controller.
- `BackEnd/src/controllers/userController.js` — User management (create, update, list, soft-delete).
- `BackEnd/src/controllers/taskController.js` — Task CRUD and business logic.
- `BackEnd/src/controllers/taskChangeLogController.js` — Controller for task change logs (audit trail).
- `BackEnd/src/controllers/taskAssignmentController.js` — Handle assigning tasks to users.
- `BackEnd/src/controllers/roleModulePermissionController.js` — Manage role-module permissions.
- `BackEnd/src/controllers/roleController.js` — Role CRUD and list endpoints.
- `BackEnd/src/controllers/notificationController.js` — Notification endpoints (list, mark-read).
- `BackEnd/src/controllers/moduleController.js` — Module management controller (create/list modules).

### BackEnd - routes
- `BackEnd/src/routes/authRoutes.js` — Routes for auth (login/register) mounted at `/api/auth`.
- `BackEnd/src/routes/companyRoutes.js` — Routes for companies (`/api/companies`).
- `BackEnd/src/routes/commentRoutes.js` — Comment-related routes (`/api/comments`).
- `BackEnd/src/routes/departmentRoutes.js` — Department endpoints.
- `BackEnd/src/routes/documentRoutes.js` — Document upload/download routes.
- `BackEnd/src/routes/generalDocumentsRoutes.js` — General documents routes.
- `BackEnd/src/routes/iterationRoutes.js` — Iteration endpoints.
- `BackEnd/src/routes/index.js` — Route aggregator (may export or mount groups).
- `BackEnd/src/routes/moduleRoutes.js` — Module endpoints (`/api/modules`).
- `BackEnd/src/routes/roleModulePermissionRoutes.js` — Permission mapping routes.
- `BackEnd/src/routes/notificationRoutes.js` — Notification routes.
- `BackEnd/src/routes/roleRoutes.js` — Role management routes.
- `BackEnd/src/routes/taskRoutes.js` — Task endpoints.
- `BackEnd/src/routes/taskChangeLogRoutes.js` — Task change log routes.
- `BackEnd/src/routes/taskAssignmentRoutes.js` — Task assignment routes.
- `BackEnd/src/routes/userRoutes.js` — User management routes (note many expect `/:moduleId`).
- `BackEnd/src/routes/documentRoutes.js` — (duplicate listing handled above) — document endpoints.

### BackEnd - middlewares
- `BackEnd/src/middlewares/authMiddlewares.js` — JWT extraction and verification middleware (attaches `req.user`).
- `BackEnd/src/middlewares/permissionsMiddlewares.js` — Factory that checks role permissions for a given `:moduleId` and action (`read`/`write`/`delete`).

### BackEnd - utils
- `BackEnd/src/utils/bootstrapSystemSuperAdmin.js` — Bootstraps default company/role/user and inserts module rows; sends email with credentials.
- `BackEnd/src/utils/checkSuperRoleAdded.js` — Ensures a `Super Admin` role exists (helper used on startup).
- `BackEnd/src/utils/sendEmail.js` — Email helper (nodemailer wrapper) used by bootstrap and notifications.
- `BackEnd/src/utils/getHigherRoleUserRecurcievly.js` — Utility to find higher-role users recursively.
- `BackEnd/src/utils/generateRandomPassword.js` — Random password generator used by bootstrap.

---

## frontend-new (209 files)

Top-level frontend is a Vite + React app with Material UI. Files grouped by purpose.

- `frontend-new/vite.config.js` — Vite configuration.
- `frontend-new/pnpm-lock.yaml` — Lockfile (pnpm).
- `frontend-new/package.json` — Frontend package manifest and scripts.
- `frontend-new/package-lock.json` — Lockfile (npm) present as well.
- `frontend-new/index.html` — App HTML template.
- `frontend-new/eslint.config.js` — ESLint config for frontend.
- `frontend-new/Dockerfile` — Dockerfile for frontend image.
- `frontend-new/.gitignore` — Frontend ignore rules.

### frontend-new - public/assets
- `frontend-new/public/bg-sign-in-basic.jpeg` — Background image used on the sign-in page.

### frontend-new - core app
- `frontend-new/src/main.jsx` — React entrypoint; wraps app in providers and mounts to DOM.
- `frontend-new/src/App.jsx` — App router + layout (routes for onboarding, dashboard, modules, roles, users, tasks, documents, iterations, departments).
- `frontend-new/src/App.css` — Global CSS for the app.
- `frontend-new/src/index.css` — Base styles.
- `frontend-new/src/reportWebVitals.js` — Vite/CRA performance helper.

### frontend-new - services & utils
- `frontend-new/src/services/axiosinstance.js` — Axios instance that reads `BASE_API_URL` and adds `Authorization` header from `localStorage.jwtToken`.
- `frontend-new/src/utils/Constants.js` — Exposes `BASE_API_URL` from `import.meta.env.VITE_BASE_API_URL`.
- `frontend-new/src/utils/socket.js` — frontend Socket.IO client helper.
- `frontend-new/src/context/index.jsx` — Material UI controller/provider (theme & global UI state).

### frontend-new - components (selected)
- `frontend-new/src/Components/NotificationMenu.jsx` — Notification menu component.
- `frontend-new/src/Components/Header/index.jsx` — App header component.
- `frontend-new/src/Components/Header/style.js` — Header styling for MUI.
- `frontend-new/src/Components/Sidebar/index.jsx` — Sidebar navigation component.
- `frontend-new/src/Components/Sidebar/SidebarRoot.jsx` — Sidebar root wrapper and layout styles.
- `frontend-new/src/Components/Sidebar/styles/sidenav.js` — Sidebar style helpers.

### frontend-new - pages (selected)
- `frontend-new/src/pages/auth/Login.jsx` — Login page (posts credentials to backend, stores JWT).
- `frontend-new/src/pages/onboarding/CompanyName.jsx` — Onboarding step: company name.
- `frontend-new/src/pages/onboarding/CompanyDetails.jsx` — Onboarding details form.
- `frontend-new/src/pages/onboarding/CompanyList.jsx` — Company list page.
- `frontend-new/src/pages/role_management/RoleList.jsx` — Role list page.
- `frontend-new/src/pages/role_management/RoleForm.jsx` — Role create/edit form.
- `frontend-new/src/pages/role_management/AssignPermissions.jsx` — Assign permissions UI.
- `frontend-new/src/pages/role_management/AssignPermissionstoRole.jsx` — Role-specific permission assignment.
- `frontend-new/src/pages/user_management/CreateUser.jsx` — Create user form.
- `frontend-new/src/pages/user_management/UpdateUser.jsx` — Update user page.
- `frontend-new/src/pages/user_management/UserList.jsx` — Users list page.
- `frontend-new/src/pages/user_management/changePassword.jsx` — Change password page.
- `frontend-new/src/pages/TaskManagement/TaskList.jsx` — Task list UI.
- `frontend-new/src/pages/TaskManagement/CreateTask.jsx` — Create task page.
- `frontend-new/src/pages/TaskManagement/EditTask.jsx` — Edit task page (route includes `:moduleId/:taskId`).
- `frontend-new/src/pages/TaskManagement/AssignedTaskPage.jsx` — Assigned tasks list for the user.
- `frontend-new/src/pages/TaskManagement/BulkTaskAssignment.jsx` — Bulk assignment UI.
- `frontend-new/src/pages/TaskManagement/UserTaskAssignment.jsx` — Assign tasks to users.
- `frontend-new/src/pages/TaskManagement/TaskUploadPage.jsx` — Upload tasks via file UI.
- `frontend-new/src/pages/TaskManagement/SelectCompany.jsx` — Select company dropdown/page.
- `frontend-new/src/pages/module_management/ModuleList.jsx` — List modules UI.
- `frontend-new/src/pages/module_management/ModuleForm.jsx` — Create/edit module form.
- `frontend-new/src/pages/Iteration/IterationList.jsx` — Iterations listing.
- `frontend-new/src/pages/Iteration/CreateIteration.jsx` — Create iteration page.
- `frontend-new/src/pages/Iteration/EditIteration.jsx` — Edit iteration page.
- `frontend-new/src/pages/Iteration/SelectIterationPage.jsx` — Select iteration helper page.
- `frontend-new/src/pages/DocumentManagement/DocumentManagementPage.jsx` — Document management UI.
- `frontend-new/src/pages/department/DepartmentList.jsx` — Department list.
- `frontend-new/src/pages/department/DepartmentForm.jsx` — Create/edit department.
- `frontend-new/src/pages/standard/SelectStandard.jsx` — Select standard (ISO) page.

### frontend-new - theme & assets
- `frontend-new/src/theme.js` — Theme provider and MUI theme setup.
- `frontend-new/src/assets/theme/*` — Many theme components and functions (buttons, dialog, card, base styles, colors, breakpoints, typography). These files are MUI theme customizations used across the app.

### frontend-new - styles
- Many `.css` files under `src/styles/*` for pages such as TaskList, RoleForm, ModuleList, LoginPage, UploadPopup, etc. These are per-page CSS assets.

### frontend-new - tests
- `frontend-new/src/App.test.js` — Basic React app test (Jest/React testing scaffold).

---

If you want a full line-by-line inventory (one line per exact file path for all 277 code files) exported into `docs/full-code-index.md`, say "Export full list" and I'll create it.
