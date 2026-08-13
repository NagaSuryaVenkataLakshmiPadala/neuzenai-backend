import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);

export default router;
