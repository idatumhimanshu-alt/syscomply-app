import express from "express";
import { createFolder, uploadGeneralDocument, listDocuments,deleteDocument,deleteFolder,updateFolder,updateDocument } from "../controllers/generalDocumentController.js";
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post("/folder/:moduleId",authenticateUser,checkPermission("write"), createFolder);
router.post("/document/:moduleId",authenticateUser,checkPermission("write"), uploadGeneralDocument);
//router.post("/uploadFolder/:moduleId",authenticateUser,checkPermission("write"), uploadFolder);
router.put("/folder/:moduleId",authenticateUser,checkPermission("write"), updateFolder);
router.put("/document/:moduleId",authenticateUser,checkPermission("write"), updateDocument);
router.get("/:moduleId/:folderId",authenticateUser,checkPermission("read"), listDocuments);
router.delete("/document/:moduleId/:document_id",authenticateUser, checkPermission("delete"),deleteDocument);
router.delete("/folder/:moduleId/:folder_id",authenticateUser, checkPermission("delete"),deleteFolder);

export default router;