import express from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceList,
  correctAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/me', getMyAttendance);
router.get('/', authorize('ADMIN', 'HR'), getAttendanceList);
router.put('/:id', authorize('ADMIN', 'HR'), correctAttendance);

export default router;
