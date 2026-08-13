import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeavesList,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveBalance,
  updateLeaveBalance,
} from '../controllers/leaveController.js';
import { authenticate, authorize, verifyResourceOwnership } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', applyLeave);
router.get('/me', getMyLeaves);
router.get('/', authorize('ADMIN', 'HR'), getLeavesList);
router.patch('/:id/approve', authorize('ADMIN', 'HR'), approveLeave);
router.patch('/:id/reject', authorize('ADMIN', 'HR'), rejectLeave);
router.patch('/:id/cancel', cancelLeave);

router.get('/balance/me', getLeaveBalance);
router.get('/balance/:employeeId', verifyResourceOwnership('employeeId'), getLeaveBalance);
router.put('/balance/:employeeId', authorize('ADMIN', 'HR'), updateLeaveBalance);

export default router;
