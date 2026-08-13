import { CalendarEvent } from '../models/CalendarEvent.js';
import { Holiday } from '../models/Holiday.js';
import { logAudit } from '../services/auditService.js';

export const getEvents = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }

    // Role visibility
    if (req.user.role === 'EMPLOYEE') {
      query.visibility = { $in: ['PUBLIC'] };
    }

    const events = await CalendarEvent.find(query)
      .populate('employeeId', 'firstName lastName designation department')
      .sort({ startDate: 1 });

    const holidays = await Holiday.find();

    const formattedEvents = [
      ...events.map((e) => ({
        id: e._id,
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        category: e.eventType,
        description: e.description,
        visibility: e.visibility,
        employee: e.employeeId,
        color: e.eventType === 'LEAVE' ? '#EF4444' : e.eventType === 'ONBOARDING' ? '#F59E0B' : '#3B82F6',
      })),
      ...holidays.map((h) => ({
        id: `holiday-${h._id}`,
        title: `🌴 ${h.name}`,
        start: h.date,
        end: h.date,
        allDay: true,
        category: 'HOLIDAY',
        description: h.description,
        color: '#10B981',
      })),
    ];

    return res.status(200).json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, eventType, visibility, location } = req.body;

    const event = await CalendarEvent.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      eventType: eventType || 'COMPANY_EVENT',
      visibility: visibility || 'PUBLIC',
      location,
      createdBy: req.user._id,
    });

    await logAudit({
      req,
      user: req.user,
      action: 'CREATE_EVENT',
      entity: 'CalendarEvent',
      entityId: event._id,
      description: `Created calendar event "${title}"`,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    Object.assign(event, req.body);
    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
