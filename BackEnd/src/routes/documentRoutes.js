import express from "express";
import { uploadDocument, getDocumentsByTask, deleteDocument ,updateDocumentDetails } from "../controllers/documentController.js";
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post("/:moduleId",authenticateUser,checkPermission("write"), uploadDocument);
router.put("/:moduleId/:documentId",authenticateUser,checkPermission("write"), updateDocumentDetails);
router.get("/:moduleId/:task_id",authenticateUser,checkPermission("read"), getDocumentsByTask);
router.delete("/:moduleId/:id",authenticateUser, checkPermission("delete"),deleteDocument);

export default router;
