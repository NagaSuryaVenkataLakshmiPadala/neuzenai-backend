import express from 'express';
import {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeReport,
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR'));

router.get('/attendance', getAttendanceReport);
router.get('/leave', getLeaveReport);
router.get('/payroll', getPayrollReport);
router.get('/employees', getEmployeeReport);

export default router;
