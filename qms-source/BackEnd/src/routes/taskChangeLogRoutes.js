import express from 'express';
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';
import {getTaskChangeLogs} from "../controllers/taskChangeLogController.js";

const router = express.Router();

router.get("/:moduleId/:task_id",authenticateUser,checkPermission("read"),getTaskChangeLogs);

export default router;