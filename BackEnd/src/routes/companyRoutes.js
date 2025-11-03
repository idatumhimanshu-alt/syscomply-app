import express from 'express';
import companyController from '../controllers/companyController.js';
import checkPermission from '../middlewares/permissionsMiddlewares.js';
import authenticateUser from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/:moduleId',authenticateUser,checkPermission("write"), companyController.createCompany);
router.put('/:moduleId/:id', authenticateUser,checkPermission("write"),companyController.updateCompanyDetails);
router.delete('/:moduleId/:id', authenticateUser,checkPermission("delete"),companyController.softDeleteCompany);
router.get('/:moduleId/:id',authenticateUser,checkPermission("read"), companyController.getCompanyDetails);
router.get('/:moduleId',authenticateUser,checkPermission("read"), companyController.getCompanyDetails);

export default router;
