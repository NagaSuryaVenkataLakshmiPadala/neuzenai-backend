import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  updateEmployeeRole,
} from '../controllers/employeeController.js';
import { authenticate, authorize, verifyResourceOwnership } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getEmployees);
router.get('/:id', verifyResourceOwnership('id'), getEmployeeById);
router.post('/', authorize('ADMIN', 'HR'), createEmployee);
router.put('/:id', verifyResourceOwnership('id'), updateEmployee);
router.patch('/:id/status', authorize('ADMIN', 'HR'), updateEmployeeStatus);
router.patch('/:id/role', authorize('ADMIN'), updateEmployeeRole);

export default router;
