import express from 'express';
import moduleController from '../controllers/moduleController.js';
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post('/:moduleId',authenticateUser,checkPermission("write"), moduleController.createModule);      // Add a new module
router.get('/:moduleId',authenticateUser, checkPermission("read"),moduleController.getAllModules);      // Get all modules
router.get('/:moduleId/:id',authenticateUser, checkPermission("read"),moduleController.getModuleById);   // Get module by ID
router.put('/:moduleId/:id',authenticateUser, checkPermission("write"),moduleController.updateModule);    // Update a module
router.delete('/:moduleId/:id',authenticateUser,checkPermission("delete"), moduleController.deleteModule); // Delete a module

export default router;
