import express from "express";
import { addComment, getComments, deleteComment } from "../controllers/commentController.js";
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';
const router = express.Router();

router.post("/:moduleId",authenticateUser,checkPermission("write") ,addComment);
router.get("/:moduleId/:task_id",authenticateUser, checkPermission("read"),getComments);
router.delete("/:moduleId/:id",authenticateUser,checkPermission("delete"), deleteComment);

export default router;
