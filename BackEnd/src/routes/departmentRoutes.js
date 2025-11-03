import express from 'express';
import departmentController from '../controllers/departmentController.js'
import authenticateUser from '../middlewares/authMiddlewares.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';

const router = express.Router();

router.post('/:moduleId',authenticateUser,checkPermission("write"), departmentController.createDepartment);     
router.get('/:moduleId',authenticateUser, checkPermission("read"),departmentController.getAllDepartments);     
router.get('/:moduleId/:id',authenticateUser, checkPermission("read"),departmentController.getDepartmentById);   
router.put('/:moduleId/:id',authenticateUser, checkPermission("write"),departmentController.updateDepartment);    
router.delete('/:moduleId/:id',authenticateUser,checkPermission("delete"),departmentController.deleteDepartment); 

export default router;