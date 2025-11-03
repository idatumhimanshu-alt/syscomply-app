import express from "express";
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask ,getChildTasks,uploadTasksFromExcel,upload,insertApprovedTasks,getTaskSummary} from "../controllers/taskController.js";
import authenticateUser from '../middlewares/authMiddlewares.js'
import checkPermission from '../middlewares/permissionsMiddlewares.js';
const router = express.Router();

router.post("/:moduleId",authenticateUser,checkPermission("write"), createTask);
router.post("/upload-tasks/:moduleId", authenticateUser,checkPermission("write") ,upload.single("file"), uploadTasksFromExcel);
router.post("/insert-approved-tasks/:moduleId",authenticateUser,checkPermission("write"), insertApprovedTasks);
router.post("/task-summary/:moduleId",authenticateUser,checkPermission("write"), getTaskSummary);
router.get("/:moduleId",authenticateUser,checkPermission("read"), getAllTasks);
router.get("/:moduleId/:id",authenticateUser,checkPermission("read"), getTaskById);
router.get("/:moduleId/childTask/:task_id",authenticateUser,checkPermission("read"),getChildTasks);
router.put("/:moduleId/:id",authenticateUser,checkPermission("write"), updateTask);
router.delete("/:moduleId/:id",authenticateUser, checkPermission("delete"),deleteTask);

export default router;
