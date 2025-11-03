# QMS Application - Setup Guide for Replit

## Overview
Your QMS (Quality Management System) application has been successfully cloned and configured to run on Replit. The only modification made was adapting the database from MySQL to PostgreSQL, as Replit doesn't support MySQL.

## Application Structure

```
├── BackEnd/              # Express.js backend with Sequelize ORM
│   ├── src/
│   │   ├── server.js     # Main entry point
│   │   ├── config/       # Database and Socket.IO configuration
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API endpoints
│   │   ├── controllers/  # Business logic
│   │   └── middlewares/  # Auth and permissions
│   └── package.json
│
├── frontend-new/         # React frontend with Vite and Material UI
│   ├── src/
│   └── package.json
│
└── qms-runner.js         # Startup script to run both services
```

## What Was Modified

### Database Configuration
- **File**: `BackEnd/src/config/db.js`
- **Change**: Sequelize dialect changed from `mysql` to `postgres`
- **Reason**: Replit provides PostgreSQL, not MySQL
- The app now uses the `DATABASE_URL` environment variable provided by Replit

### Dependencies
- **File**: `BackEnd/package.json`
- **Change**: Replaced `mysql2` with `pg` and `pg-hstore`
- **Reason**: PostgreSQL drivers for Sequelize

### Environment Configuration
- Created `BackEnd/.env` with necessary environment variables
- Created `frontend-new/.env` with API URL configuration
- Database credentials are automatically provided by Replit

## Running the Application

### Option 1: Using the Runner Script (Recommended)
```bash
node qms-runner.js
```

This script will:
1. Install backend dependencies (if needed)
2. Install frontend dependencies (if needed)
3. Start the backend server on port 5000
4. Start the frontend dev server on port 3000

### Option 2: Manual Start

#### Backend
```bash
cd BackEnd
npm install
npm run dev
```

#### Frontend (in a separate terminal)
```bash
cd frontend-new
npm install
npm run dev
```

## Access Points

- **Backend API**: http://localhost:5000
- **Frontend UI**: http://localhost:3000

## Default Login Credentials

After the first run, the system will bootstrap with default credentials:

```
Email:    admin@idatum.com
Password: Admin@123
```

> **Note**: These credentials are created by the bootstrap script (`BackEnd/src/utils/bootstrapSystemSuperAdmin.js`) and are logged in the console when the backend starts for the first time.

## Environment Variables

### Backend (BackEnd/.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=<auto-configured>
BOOTSTRAP_ON_SYNC=true
```

### Frontend (frontend-new/.env)
```env
VITE_BASE_API_URL=http://localhost:5000/api
```

### Database
The PostgreSQL database connection is automatically configured via `DATABASE_URL` environment variable provided by Replit.

## Features

The QMS application includes:

- ✅ **Authentication & Authorization**: JWT-based auth with role-based access control
- ✅ **Module Permissions**: Granular permissions (read/write/delete) per role per module
- ✅ **Task Management**: Create, assign, and track tasks with status updates
- ✅ **Document Management**: Upload, version, and manage documents
- ✅ **Real-time Notifications**: Socket.IO for live updates
- ✅ **User & Department Management**: Organize users by department and role
- ✅ **Company Management**: Multi-tenant support with company organization
- ✅ **Audit Trail**: Task change logs and activity tracking

## Database Bootstrap

On first run, the application automatically creates:
1. Default company: "IDATUM"
2. System Super Admin role
3. Default modules (with UUIDs)
4. Super admin user with credentials (see above)
5. Full permissions for the super admin role

## API Routes

The backend provides REST APIs under `/api/*`:
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/roles` - Role management
- `/api/modules` - Module registry
- `/api/permissions` - Role-module permissions
- `/api/tasks` - Task management
- `/api/documents` - Document management
- `/api/notifications` - Notifications
- `/api/departments` - Department management
- And more...

## Development Notes

### Database Sync
The application uses `sequelize.sync({ alter: true })` which automatically updates the database schema to match the models. This is convenient for development but should be replaced with proper migrations for production.

### File Uploads
Uploaded files are stored in `BackEnd/uploads/` and served statically at `/api/uploads`.

### Socket.IO
Real-time features use Socket.IO configured in `BackEnd/src/config/socket.js`.

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify DATABASE_URL environment variable is set
- Check backend logs for database connection errors

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `frontend-new/.env` has correct VITE_BASE_API_URL
- Check browser console for CORS errors

### Database connection errors
- The DATABASE_URL is automatically provided by Replit
- If you see connection errors, check that PostgreSQL is enabled in your Replit

## Next Steps

1. Start the application using `node qms-runner.js`
2. Access the frontend at http://localhost:3000
3. Login with the default credentials
4. Explore the QMS features
5. For production deployment, use Replit's deployment features

## Important Files

- `BackEnd/src/server.js` - Backend entry point
- `BackEnd/src/config/db.js` - Database configuration (modified for PostgreSQL)
- `BackEnd/src/utils/bootstrapSystemSuperAdmin.js` - Bootstrap script
- `frontend-new/src/App.jsx` - Frontend router and layout
- `frontend-new/src/services/axiosinstance.js` - API client configuration

## Original Documentation

For more details about the original architecture, see:
- `README_DEV.md` - Original developer guide
- `docs/architecture.md` - Detailed architecture documentation (in source repo)

---

**Note**: This is your existing QMS application running on Replit with minimal modifications (only database adapter change from MySQL to PostgreSQL). All original features and functionality are preserved.
