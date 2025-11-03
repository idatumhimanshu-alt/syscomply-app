import express from 'express';
import userController from '../controllers/userController.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';
import authenticateUser from '../middlewares/authMiddlewares.js';
const router = express.Router();

router.post('/:moduleId',authenticateUser,checkPermission("write"), userController.createUser);  // Create user
router.get('/:moduleId',authenticateUser,checkPermission("read"), userController.getUserDetails);  // Get all users
router.get('/:moduleId/getAssignableUser',authenticateUser,checkPermission("read"), userController.getAssignableUsers);
router.get('/:moduleId/getUsersWithHigherRole',authenticateUser,checkPermission("read"), userController.getUsersWithHigherRole);
router.put('/:moduleId/:id',authenticateUser, checkPermission("write"),userController.updateUserDetails);  // Update user details
router.get('/:moduleId/:id',authenticateUser,checkPermission("read"), userController.getUserDetails);  // Get user by ID
router.delete('/:moduleId/:id',authenticateUser,checkPermission("delete"), userController.softDeleteUser)

export default router;
