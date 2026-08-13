import { Holiday } from '../models/Holiday.js';
import { logAudit } from '../services/auditService.js';

export const getHolidays = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req, res, next) => {
  try {
    const { name, date, description, location } = req.body;

    const holiday = await Holiday.create({
      name,
      date: new Date(date),
      description,
      location: location || 'All Locations',
      createdBy: req.user._id,
    });

    await logAudit({
      req,
      user: req.user,
      action: 'CREATE_HOLIDAY',
      entity: 'Holiday',
      entityId: holiday._id,
      description: `Added holiday "${name}" for ${new Date(date).toLocaleDateString()}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found.',
      });
    }

    Object.assign(holiday, req.body);
    await holiday.save();

    return res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
