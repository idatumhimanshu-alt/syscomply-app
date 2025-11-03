import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import bodyParser from "body-parser";
import { createProxyMiddleware } from 'http-proxy-middleware';
import sequelize from "./config/db.js";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import roleModulePermissionRoutes from "./routes/roleModulePermissionRoutes.js";
import ensureSuperAdminRole from "./utils/checkSuperRoleAdded.js";
import taskRoutes from "./routes/taskRoutes.js";
import taskAssignmentRoutes from "./routes/taskAssignmentRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import taskChangeLogRoutes from "./routes/taskChangeLogRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import generalDocumentsRoutes from "./routes/generalDocumentsRoutes.js";
import iterationRoutes from "./routes/iterationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import http from "http";
import { initSocket } from "./config/socket.js";
import bootstrapSystemSuperAdmin from "./utils/bootstrapSystemSuperAdmin.js"; // run before app.listen()




// Load environment variables
config();
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server,{
    cors: { origin: "*" }
});


// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/permissions", roleModulePermissionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/task-assignments", taskAssignmentRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/taskChangeLog", taskChangeLogRoutes);
app.use("/api/uploads", express.static("uploads"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/generalDocuments", generalDocumentsRoutes);
app.use("/api/iteration", iterationRoutes);
app.use("/api/department", departmentRoutes);

// Proxy all non-API requests to the frontend (running on port 3000)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true, // proxy websockets
  logLevel: 'silent'
}));

const PORT = process.env.PORT || 5000;

// Ensure database sync
sequelize
  .sync({ alter: true }) // Use `force: true` only for development resets
  .then(async () => {
    console.log("✅ Database & tables synced");
    await bootstrapSystemSuperAdmin();
  })
  .catch((err) => console.error("Error syncing database:", err));

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
