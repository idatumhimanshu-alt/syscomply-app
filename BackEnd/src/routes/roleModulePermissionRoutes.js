import express from 'express';
import roleModulePermissionController from '../controllers/roleModulePermissionController.js';
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post('/:moduleId',authenticateUser, checkPermission("write"),roleModulePermissionController.assignPermission);     // Assign permissions
router.get('/',authenticateUser, roleModulePermissionController.getAllPermissions);     // Get all role-module permissions
router.get('/:role_id',authenticateUser, roleModulePermissionController.getPermissionsByRole); // Get permissions by role
//router.put('/:role_id/:module_id',authenticateUser, roleModulePermissionController.updatePermission); // Update permissions
router.delete('/:moduleId', authenticateUser,checkPermission("delete"),roleModulePermissionController.deletePermission); // Remove permission

export default router;
