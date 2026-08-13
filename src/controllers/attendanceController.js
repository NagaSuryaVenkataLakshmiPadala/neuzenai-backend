import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { logAudit } from '../services/auditService.js';

const getTodayString = (d = new Date()) => {
  return d.toISOString().split('T')[0];
};

export const checkIn = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile found for this user account.',
      });
    }

    const todayStr = getTodayString();
    const existing = await Attendance.findOne({
      employeeId: req.user.employeeId._id,
      date: todayStr,
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today.',
        data: existing,
      });
    }

    const now = new Date();
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
    const status = isLate ? 'LATE' : 'PRESENT';

    let record;
    if (existing) {
      existing.checkIn = now;
      existing.status = status;
      record = await existing.save();
    } else {
      record = await Attendance.create({
        employeeId: req.user.employeeId._id,
        date: todayStr,
        checkIn: now,
        status,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully checked in at ${now.toLocaleTimeString()}`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile.',
      });
    }

    const todayStr = getTodayString();
    const record = await Attendance.findOne({
      employeeId: req.user.employeeId._id,
      date: todayStr,
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You must check in before checking out.',
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out for today.',
        data: record,
      });
    }

    const now = new Date();
    record.checkOut = now;

    // Compute working hours in decimal hours
    const diffMs = now.getTime() - new Date(record.checkIn).getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    record.workingHours = hours;

    if (hours < 4 && record.status !== 'ON_LEAVE') {
      record.status = 'HALF_DAY';
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Checked out successfully. Worked ${hours} hours.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record.',
      });
    }

    const todayStr = getTodayString();
    const todayRecord = await Attendance.findOne({
      employeeId: req.user.employeeId._id,
      date: todayStr,
    });

    const history = await Attendance.find({
      employeeId: req.user.employeeId._id,
    })
      .sort({ date: -1 })
      .limit(60);

    return res.status(200).json({
      success: true,
      data: {
        today: todayRecord || null,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { date, startDate, endDate, employeeId, department, status } = req.query;

    const query = {};

    if (date) query.date = date;
    else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const total = await Attendance.countDocuments(query);
    const attendance = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName email employeeCode department designation')
      .populate('correctedBy', 'email role')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const correctAttendance = async (req, res, next) => {
  try {
    const { status, checkIn, checkOut, notes } = req.body;
    const record = await Attendance.findById(req.params.id).populate('employeeId');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }

    const oldValue = record.toObject();

    if (status) record.status = status;
    if (checkIn) record.checkIn = new Date(checkIn);
    if (checkOut) record.checkOut = new Date(checkOut);
    if (notes) record.notes = notes;

    if (record.checkIn && record.checkOut) {
      const diffMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
      record.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    record.correctedBy = req.user._id;
    await record.save();

    await logAudit({
      req,
      user: req.user,
      action: 'CORRECT_ATTENDANCE',
      entity: 'Attendance',
      entityId: record._id,
      description: `Corrected attendance for ${record.employeeId?.firstName} ${record.employeeId?.lastName} on ${record.date}`,
      oldValue,
      newValue: record.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};
