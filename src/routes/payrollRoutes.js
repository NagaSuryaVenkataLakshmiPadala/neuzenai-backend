import express from 'express';
import {
  getPayrollList,
  getMyPayroll,
  getPayrollById,
  processBatchPayroll,
  updatePayrollDraft,
  approvePayroll,
  downloadPayslipPDF,
} from '../controllers/payrollController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'HR'), getPayrollList);
router.get('/me', getMyPayroll);
router.get('/:id', getPayrollById);
router.post('/process', authorize('ADMIN', 'HR'), processBatchPayroll);
router.put('/:id', authorize('ADMIN', 'HR'), updatePayrollDraft);
router.patch('/:id/approve', authorize('ADMIN', 'HR'), approvePayroll);
router.get('/:id/pdf', downloadPayslipPDF);

export default router;
