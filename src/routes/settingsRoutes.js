import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize('ADMIN'), updateSettings);

export default router;
