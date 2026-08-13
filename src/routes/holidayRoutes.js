import express from 'express';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../controllers/holidayController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getHolidays);
router.post('/', authorize('ADMIN', 'HR'), createHoliday);
router.put('/:id', authorize('ADMIN', 'HR'), updateHoliday);
router.delete('/:id', authorize('ADMIN', 'HR'), deleteHoliday);

export default router;
