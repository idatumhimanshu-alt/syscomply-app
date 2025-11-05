# Quality Management System (QMS)

## Overview

This is a comprehensive Quality Management System built with a modern tech stack. The application supports multi-tenant companies with role-based access control, task management, document handling, audit trails, and real-time notifications. It's designed for ISO compliance workflows (ISO 9001, ISO 27001) with features for managing tasks, iterations, departments, and extensive permission controls.

The system uses a monorepo-like structure with separate backend and frontend applications that communicate via REST API and WebSocket connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## Replit Deployment

**Status**: ✅ Successfully deployed and running on Replit (November 2025)

**Changes Made for Replit Compatibility**:
1. **Database Migration**: Migrated from MySQL to PostgreSQL (Neon-backed)
   - All Sequelize models updated for PostgreSQL compatibility
   - Connection via `DATABASE_URL` environment variable

2. **MUI Version Fix**: Downgraded Material UI from v7.3.4 to v6.4.4
   - Frontend code uses Grid2 component only available in MUI v6
   - Installed: `@mui/material@6.4.4`, `@mui/icons-material@6.4.4`
   - Data Grid: `@mui/x-data-grid@7.23.2`

3. **Dependency Management**: 
   - Created symlink: `frontend-new/node_modules` → `../node_modules`
   - Frontend dependencies installed in root node_modules
   - Both frontend and backend share the same dependency tree

4. **Application Wrapper**: Created `server/index.ts`
   - Orchestrates startup of both backend and frontend
   - Frontend (Vite) runs on port 3000
   - Backend (Express) runs on port 5000
   - Started via: `npm run dev` (runs `tsx server/index.ts`)

**Default Credentials**:
- Email: `admin@idatum.com`
- Password: `Admin@123`
- Company: IDATUM

**Known Issues**:
- React prop warnings in console (pre-existing, not deployment-related)
- Some 403 permission errors for role/company endpoints (pre-existing module permission configuration)

## System Architecture

### Application Structure

**Backend (BackEnd/)**
- **Framework**: Express.js with ES modules
- **ORM**: Sequelize for database abstraction
- **Entry Point**: `BackEnd/src/server.js` - bootstraps the application, registers routes, initializes Socket.IO, and performs database sync
- **Database Strategy**: Uses `sequelize.sync({ alter: true })` instead of migrations - schema changes are applied automatically on startup
- **Port**: Defaults to 5000 (configurable via `PORT` env var)

**Frontend (frontend-new/)**
- **Framework**: React 19 with Vite bundler
- **UI Library**: Material UI v6 (MUI) following Material Design principles
- **Port**: Defaults to 3000
- **Design System**: Material Design with enterprise dashboard aesthetic, Roboto typography, 8px spacing system

**Hybrid Client (client/)**
- **Framework**: React with TypeScript, Vite, and shadcn/ui components
- **UI Approach**: Radix UI primitives with Tailwind CSS styling
- **Routing**: wouter for client-side routing
- **State Management**: TanStack Query for server state

### Data Layer

**Database**
- **Primary**: PostgreSQL (originally MySQL, migrated for Replit compatibility)
- **Connection**: Configured via `DATABASE_URL` environment variable or individual DB_* vars
- **Models** (Sequelize):
  - `Company` - Multi-tenant company entities with soft delete support
  - `User` - User accounts with bcrypt password hashing, self-referential reporting hierarchy
  - `Role` - Hierarchical role definitions with parent-child relationships
  - `Module` - Feature/module registry used for permissions
  - `RoleModulePermission` - Junction table mapping roles to module-level permissions (read/write/delete)
  - `Task` - Core business tasks with status, priority, compliance tracking
  - `TaskAssignment` - Many-to-many assignments with automatic manager inclusion
  - `TaskChangeLog` - Audit trail for task modifications
  - `Department` - Organizational departments per company
  - `Iteration` - Time-boxed task cycles/sprints
  - `Document` - File metadata for task attachments
  - `GeneralDocument` & `GeneralDocumentFolder` - Hierarchical document management with visibility scopes
  - `Comment` - Task comments
  - `Notification` - In-app notifications with seen/unseen status

**Bootstrapping**
- On first run: `bootstrapSystemSuperAdmin.js` creates default company, system super admin role, modules, and admin user
- Modules are inserted with UUIDs that frontend uses for permission-gated routes
- Email notifications sent to new users with auto-generated passwords

### Authentication & Authorization

**Authentication**
- JWT-based authentication with tokens issued on login
- Tokens include: `userId`, `role` (UUID), `company` (UUID), `email`, `name`
- Secret key: `JWT_SECRET` environment variable
- Middleware: `authMiddlewares.js` - validates Bearer tokens and attaches decoded user to `req.user`

**Authorization**
- Role-based with module-level granular permissions
- Permissions stored in `RoleModulePermission` with flags: `can_read`, `can_write`, `can_delete`
- Middleware: `permissionsMiddlewares.js` - expects `moduleId` as first route param (e.g., `/:moduleId/tasks`)
- Routes validate UUID-length moduleId and check user's role permissions before allowing access
- Hierarchical roles: roles can have parent roles, permissions cascade through hierarchy

**Special Role**: System Super Admin
- Company-agnostic super user
- Can manage multiple companies
- Must provide `company_id` in requests for company-specific operations
- Cannot be manually created (only via bootstrap)

### API Architecture

**REST Endpoints** (mounted under `/api/*`)
- `/api/auth` - Login, registration, token management
- `/api/companies` - Company CRUD and onboarding
- `/api/users` - User management with auto-generated passwords
- `/api/roles` - Role hierarchy and CRUD
- `/api/modules` - Module registry
- `/api/role-module-permissions` - Permission assignments
- `/api/tasks` - Task CRUD with bulk operations and Excel import/export
- `/api/task-assignments` - Assignment management with hierarchy-aware assignment
- `/api/task-changelogs` - Audit trail retrieval
- `/api/departments` - Department management
- `/api/iterations` - Iteration/sprint management
- `/api/documents` - File upload/download with metadata
- `/api/general-documents` - Hierarchical document folders and files with visibility scopes
- `/api/comments` - Task comments
- `/api/notifications` - Real-time notification delivery

**File Uploads**
- Uses `multer` middleware for multipart form handling
- Storage: `uploads/documents/` directory
- Files served via static middleware: `/api/uploads`
- Unique filenames: timestamp + random hash + original extension

**Standard Route Pattern**
```
/:moduleId/resource-action
```
Where `moduleId` is a UUID from the Module table, used for permission checks.

### Real-Time Communication

**Socket.IO**
- Initialized in `config/socket.js` and attached to HTTP server
- CORS configured for frontend origins (localhost:3000, production domains)
- **Events**:
  - `join` - Users join room by their user ID
  - Notifications emitted to specific user rooms on task changes
- **Use Cases**: 
  - Real-time notifications for task assignments, status changes, priority updates
  - Document uploads trigger notifications to relevant users
  - Change logs create notifications for assigned users and their managers

**Notification Flow**
1. Task change occurs (status, priority, assignment, document upload)
2. `TaskChangeLog` entry created
3. Affected users identified (assignees + their reporting hierarchy)
4. `Notification` records created in database
5. Socket.IO emits notification to each user's room
6. Frontend displays toast/badge updates

### Business Logic Patterns

**Task Assignment Hierarchy**
- When assigning tasks, system automatically includes all managers up the reporting chain
- Uses recursive `getAllReportToUsers()` utility to traverse `User.reportTo` hierarchy
- Ensures visibility for all supervisors without manual inclusion

**Audit Trails**
- Every task modification logged in `TaskChangeLog`
- Tracks: status, priority, assignments, document uploads, task edits
- Change logs include user details and timestamp
- Assignment changes store full user objects (id, name, email) for historical context

**Soft Deletes**
- Companies use `is_active` flag
- Users use `is_active` flag
- GeneralDocuments and Folders use Sequelize paranoid mode (`deleted_at` timestamp)
- Allows data recovery and maintains referential integrity

**Permission Enforcement**
- Routes check both authentication (valid token) and authorization (module permissions)
- Permission checks cascade: write permission implies read, delete implies write
- Module IDs are validated as UUIDs (length >= 36 characters)

**Multi-Tenancy**
- Data isolation by `company_id` foreign key
- System Super Admin can cross company boundaries with explicit `company_id` parameter
- Regular users restricted to their assigned company

### Environment Configuration

**Required Backend Variables**
```
DATABASE_URL=postgresql://...
JWT_SECRET=secret_key_here
BOOTSTRAP_ON_SYNC=true
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASS=password
```

**Required Frontend Variables**
```
VITE_BASE_API_URL=http://localhost:5000/api
```

### Development Workflow

**Backend Development**
```bash
cd BackEnd
npm install
npm run dev  # Uses --watch flag for auto-restart
```

**Frontend Development**
```bash
cd frontend-new
npm install
npm run dev  # Vite dev server on port 3000
```

**Combined Runner** (Replit-specific)
- `qms-runner.js` - Installs deps and runs both services concurrently
- `server/index.ts` - Wrapper that spawns backend as child process

**Database Schema Updates**
- Currently uses `sync({ alter: true })` - NOT recommended for production
- Future: migrate to Sequelize migrations or Umzug for version-controlled schema changes
- Avoid large schema changes without proper migration strategy

## External Dependencies

### Third-Party Services

**Email Service (Nodemailer)**
- Used for: User account creation notifications, password delivery
- Configuration: SMTP credentials in environment variables
- Purpose: Sends auto-generated passwords to new users

**Database**
- PostgreSQL (via Neon on Replit, or standard Postgres elsewhere)
- Connection pooling handled by Sequelize
- SSL optional based on environment

### NPM Packages

**Backend Core**
- `express` - Web framework
- `sequelize` - ORM for PostgreSQL
- `pg`, `pg-hstore` - PostgreSQL drivers
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `socket.io` - WebSocket server
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling
- `dotenv` - Environment variable management

**Backend Utilities**
- `uuid` - UUID generation
- `nodemailer` - Email sending
- `exceljs` - Excel file import/export for tasks
- `date-fns` - Date manipulation

**Frontend Core**
- `react`, `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `@mui/material`, `@mui/icons-material` - Material UI components
- `@emotion/react`, `@emotion/styled` - CSS-in-JS styling
- `@tanstack/react-query` - Server state management
- `axios` - HTTP client
- `socket.io-client` - WebSocket client

**Frontend Utilities**
- `jwt-decode` - Token parsing
- `react-toastify` - Toast notifications
- `recharts` - Data visualization
- `xlsx` - Excel file handling
- `html2canvas`, `jspdf` - PDF generation
- `date-fns` - Date formatting

**Development Tools**
- `vite` - Build tool and dev server
- `eslint` - Code linting
- `concurrently` - Run multiple processes

**Radix UI Components** (shadcn/ui pattern)
- Complete set of accessible component primitives
- Styled with Tailwind CSS and class-variance-authority
- Used in hybrid client build

### Build & Deployment

**Production Build**
```bash
# Frontend
cd frontend-new && npm run build

# Backend (no build step, runs directly)
cd BackEnd && npm start
```

**Deployment Considerations**
- Static files: Frontend build outputs to dist/
- Backend serves frontend in production via static middleware
- Environment variables must be set in production environment
- Database migrations needed before switching from sync strategy
- File uploads directory must be writable and backed up