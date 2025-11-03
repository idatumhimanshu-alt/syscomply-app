import express from "express";
import { assignTasks, getTaskAssignments, changeAssignee,unassignTask,getAllTaskAssignments } from "../controllers/taskAssignmentController.js";
import authenticateUser from '../middlewares/authMiddlewares.js'
import checkPermission from '../middlewares/permissionsMiddlewares.js';
const router = express.Router();

router.post("/:moduleId",authenticateUser, checkPermission("write"),assignTasks);
router.put("/:moduleId",authenticateUser,checkPermission("write"),changeAssignee);
router.get("/:moduleId",authenticateUser,checkPermission("read"),getAllTaskAssignments);
router.get("/:moduleId/:task_id",authenticateUser,checkPermission("read"), getTaskAssignments);
router.delete("/:moduleId/:id",authenticateUser, checkPermission("delete"),unassignTask);

export default router;
