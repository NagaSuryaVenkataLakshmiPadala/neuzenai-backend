import express from 'express';
import { login, logout, me, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);

export default router;
