import express from 'express';
import { login, logout , forgotPassword , changePassword} from '../controllers/authController.js';

const router = express.Router();

// POST - Login
router.post('/login', login);

// POST - Logout
router.post('/logout', logout);

//POST - forgotPassword 
router.post('/forgotPassword',forgotPassword);

//POST - Change Password 
router.post('/changePassword',changePassword);

export default router;
