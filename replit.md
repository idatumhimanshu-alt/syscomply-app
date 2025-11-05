# SysComply: Multi-Tenant Compliance Management Platform

## Overview

SysComply is a web-based, multi-tenant compliance management platform designed to replace manual audit workflows with a structured, hierarchical system. It targets businesses preparing for ISO 27001, ISO 9001, and SOC 2 audits by providing a central command center for compliance activities. Key capabilities include automating accountability with live dashboards, ensuring ironclad audit trails with comprehensive logging, offering a secure version-controlled document repository, and providing instant reports and visual analytics for compliance status. The platform supports two user types: QMS Super Admins (for platform onboarding and management) and Client Company Admins (for independent compliance program management within their respective organizations).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Fixes & Deployment Status

**Deployment Status**: ✅ Successfully deployed and running on Replit (November 2025)

**Default Credentials**:
- Email: `admin@idatum.com`
- Password: `Admin@123`
- Company: IDATUM
- Role: QMS Super Admin

**Recent Fixes (November 5, 2025)**:

✅ **Password Hashing Security Fix**
- **Issue**: Passwords were being stored in plaintext during company onboarding and manual user creation
- **Fix**: Added `bcrypt.hash(generatedPassword, 10)` before storing password_hash in both companyController and userController
- **Impact**: All new users (Company Admin accounts and manually created users) now have properly hashed passwords
- **Files Changed**: `BackEnd/src/controllers/companyController.js`, `BackEnd/src/controllers/userController.js`
- **Testing**: Email system delivers plaintext password to user, but database stores bcrypt hash (salt rounds: 10)

✅ **Module Initialization Fix**
- Bootstrap script now ensures modules and permissions exist even when company already initialized
- QMS Super Admin role can access all 11 core modules without manual SQL intervention
- Login flow works correctly without 403 errors

✅ **Company Soft Delete Bug Fix**
- Changed all Company.findByPk() calls to Company.findOne() with explicit is_active: true filter
- Affected functions: getCompanyDetails (list & single), updateCompanyDetails
- Soft-deleted companies now correctly hidden from all retrieval endpoints
- Note: Company model has defaultScope filtering by is_active, but findByPk bypasses it in Sequelize

✅ **Email System Configuration**
- Gmail integration via Google App Password (stored in EMAIL_PASS secret)
- Successfully sends Company Admin credentials during onboarding
- Important: Google App Password must be entered WITHOUT spaces (16 continuous characters)

## Critical Operational Notes

**Iteration Single-Use Constraint**:
- Each Iteration can only be used ONCE for uploading compliance tasks
- After an iteration is used, a new one must be created for additional task batches
- This must be clearly communicated to clients to avoid workflow errors

**Onboarding Handoff Process**:
1. QMS Super Admin logs in to SysComply
2. Uses "Organization Onboarding" module to create new company profile
3. System generates unique Company Admin account with auto-generated password
4. Credentials securely delivered to client via email
5. Handoff complete - QMS Super Admin direct involvement ends
6. Company Admin independently manages their compliance program

**Data Isolation Guarantee**:
- QMS Super Admin can onboard/offboard companies but CANNOT access client data
- No visibility into client tasks, documents, or compliance activities
- True multi-tenant architecture with strict company_id isolation

## System Architecture

### Application Structure

The system employs a monorepo-like structure with distinct backend and frontend applications.
- **Backend (BackEnd/)**: Built with Express.js (ES modules) and Sequelize ORM for PostgreSQL. It handles API requests, database interactions, and real-time communication via Socket.IO. Schema changes are applied automatically on startup using `sequelize.sync({ alter: true })`.
- **Frontend (frontend-new/)**: A React 19 application using Vite and Material UI v6 (MUI) for a Material Design-compliant enterprise dashboard aesthetic.
- **Hybrid Client (client/)**: An alternative React/TypeScript client utilizing Vite, shadcn/ui components (Radix UI primitives with Tailwind CSS), wouter for routing, and TanStack Query for state management.

### Data Layer

- **Database**: PostgreSQL is the primary database (migrated from MySQL for Replit compatibility). Connection is configured via `DATABASE_URL`.
- **Models**: Key Sequelize models include `Company` (multi-tenant with soft delete), `User` (with reporting hierarchy), `Role` (hierarchical), `Module` (feature registry), `RoleModulePermission` (granular permissions), `Task`, `Department`, `Iteration`, `Document`, `GeneralDocument`, `Comment`, and `Notification`.
- **Bootstrapping**: An initial script (`bootstrapSystemSuperAdmin.js`) sets up the default company, system super admin, modules, and an admin user.

### Authentication & Authorization

- **Authentication**: JWT-based, with tokens containing `userId`, `role`, `company`, `email`, and `name`. Middleware validates tokens and attaches user data.
- **Authorization**: Role-based with granular, module-level permissions (`can_read`, `can_write`, `can_delete`) stored in `RoleModulePermission`. Permissions cascade through hierarchical roles. A special System Super Admin role manages multiple companies. Middleware enforces permissions by checking the `moduleId` in routes.

### API Architecture

- **REST Endpoints**: Mounted under `/api/*`, covering authentication, company/user/role management, tasks, documents, notifications, and more. A standard route pattern is `/:moduleId/resource-action` for permission checks.
- **File Uploads**: Uses `multer` for handling multipart forms, storing files locally in `uploads/documents/`, and serving them statically.
- **Real-Time Communication**: Socket.IO is integrated for real-time notifications for task assignments, status changes, document uploads, and other relevant updates. Notifications are stored in the database and emitted to specific user rooms.

### Business Logic Patterns

- **Task Assignment Hierarchy**: Tasks automatically include managers up the reporting chain for visibility.
- **Audit Trails**: All task modifications are logged in `TaskChangeLog`, recording user, timestamp, and changes.
- **Soft Deletes**: Companies, Users, and General Documents/Folders utilize soft deletion (`is_active` flags or `deleted_at` timestamps) for data retention and integrity.
- **Permission Enforcement**: Routes strictly check both authentication and module-level authorization.
- **Multi-Tenancy**: Data isolation is enforced using `company_id` foreign keys, with System Super Admins able to cross boundaries with explicit `company_id` parameters.

### Environment Configuration

Key environment variables are required for database connection (`DATABASE_URL`), JWT secret (`JWT_SECRET`), email service (`MAIL_*`), and API URLs (`VITE_BASE_API_URL`).

## External Dependencies

### Third-Party Services

- **Email Service**: Nodemailer is used for sending user account creation notifications and temporary passwords, configured via SMTP environment variables.
- **Database**: PostgreSQL, specifically Neon for Replit deployment, or standard PostgreSQL.

### NPM Packages

- **Backend**: `express`, `sequelize`, `pg`, `bcryptjs`, `jsonwebtoken`, `socket.io`, `cors`, `multer`, `dotenv`, `uuid`, `nodemailer`, `exceljs`, `date-fns`.
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@tanstack/react-query`, `axios`, `socket.io-client`, `jwt-decode`, `react-toastify`, `recharts`, `xlsx`, `html2canvas`, `jspdf`, `date-fns`.
- **Hybrid Client**: Radix UI primitives and Tailwind CSS are used within shadcn/ui components.
- **Development Tools**: `vite`, `eslint`, `concurrently`.