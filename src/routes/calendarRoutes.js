import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/events', getEvents);
router.post('/events', authorize('ADMIN', 'HR'), createEvent);
router.put('/events/:id', authorize('ADMIN', 'HR'), updateEvent);
router.delete('/events/:id', authorize('ADMIN', 'HR'), deleteEvent);

export default router;
