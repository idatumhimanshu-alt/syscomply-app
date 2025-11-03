import express from 'express';
import roleController from '../controllers/roleController.js';
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post('/:moduleId', authenticateUser,checkPermission("write"),roleController.createRole);  // Create role
router.put('/:moduleId/:id',authenticateUser,checkPermission("write"), roleController.updateRoleDetails);  // Update role details
router.delete('/:moduleId/:id',authenticateUser,checkPermission("delete"), roleController.softDeleteRole);  // Delete role details
router.get('/:moduleId/:id',authenticateUser, checkPermission("read"),roleController.getRoleDetails);  // Get role by ID
router.get('/:moduleId',authenticateUser, checkPermission("read"),roleController.getRoleDetails);  // Get all roles

export default router;
