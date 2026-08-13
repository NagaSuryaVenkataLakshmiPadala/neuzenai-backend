import express from 'express';
import { getAdminDashboard, getHrDashboard, getEmployeeDashboard } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/admin', authorize('ADMIN'), getAdminDashboard);
router.get('/hr', authorize('ADMIN', 'HR'), getHrDashboard);
router.get('/employee', getEmployeeDashboard);

export default router;
