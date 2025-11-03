import express from 'express';
import iterationController from '../controllers/iterationController.js';
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post('/:moduleId',authenticateUser,checkPermission("write"), iterationController.createIteration);      // Add a new module
router.get('/:moduleId',authenticateUser, checkPermission("read"),iterationController.getAllIterations);      // Get all modules
router.get('/:moduleId/:id',authenticateUser, checkPermission("read"),iterationController.getIterationById);   // Get module by ID
router.put('/:moduleId/:id',authenticateUser, checkPermission("write"),iterationController.updateIteration);    // Update a module
router.delete('/:moduleId/:id',authenticateUser,checkPermission("delete"), iterationController.deleteIteration); // Delete a module

export default router;