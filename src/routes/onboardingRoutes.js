import express from 'express';
import {
  getOnboardings,
  getOnboardingById,
  createOnboarding,
  updateOnboardingStatus,
  updateDocumentStatus,
} from '../controllers/onboardingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getOnboardings);
router.get('/:id', getOnboardingById);
router.post('/', authorize('ADMIN', 'HR'), createOnboarding);
router.patch('/:id/status', authorize('ADMIN', 'HR'), updateOnboardingStatus);
router.put('/:id/documents', updateDocumentStatus);

export default router;
