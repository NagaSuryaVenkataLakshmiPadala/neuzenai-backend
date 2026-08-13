import express from 'express';
import {
  getOfferLetters,
  getOfferLetterById,
  createOfferLetter,
  downloadOfferLetterPDF,
  updateOfferLetterStatus,
} from '../controllers/offerLetterController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getOfferLetters);
router.get('/:id', getOfferLetterById);
router.post('/', authorize('ADMIN', 'HR'), createOfferLetter);
router.get('/:id/pdf', downloadOfferLetterPDF);
router.patch('/:id/status', authorize('ADMIN', 'HR'), updateOfferLetterStatus);

export default router;
