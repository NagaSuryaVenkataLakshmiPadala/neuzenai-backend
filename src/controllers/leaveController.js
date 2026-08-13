import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { Attendance } from '../models/Attendance.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';
import { User } from '../models/User.js';

const getLeaveTypeKey = (leaveType) => {
  switch (leaveType) {
    case 'Casual Leave': return 'casual';
    case 'Sick Leave': return 'sick';
    case 'Earned Leave': return 'earned';
    case 'Maternity Leave': return 'maternity';
    case 'Paternity Leave': return 'paternity';
    case 'Unpaid Leave': return 'unpaid';
    default: return 'casual';
  }
};

export const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, attachment } = req.body;

    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record associated with this user.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date.',
      });
    }

    // Calculate duration in days (including end date)
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check overlap with pending or approved leaves
    const overlap = await LeaveRequest.findOne({
      employeeId: req.user.employeeId._id,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active leave request overlapping with these dates.',
      });
    }

    // Check balance
    const currentYear = start.getFullYear();
    let balance = await LeaveBalance.findOne({
      employeeId: req.user.employeeId._id,
      year: currentYear,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId: req.user.employeeId._id,
        year: currentYear,
      });
    }

    const typeKey = getLeaveTypeKey(leaveType);
    const available = balance[typeKey].total - balance[typeKey].used;

    if (days > available && leaveType !== 'Unpaid Leave') {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance for ${leaveType}. Requested: ${days} days, Available: ${available} days.`,
      });
    }

    const leave = await LeaveRequest.create({
      employeeId: req.user.employeeId._id,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays: days,
      reason,
      attachment: attachment || '',
      status: 'PENDING',
    });

    await logAudit({
      req,
      user: req.user,
      action: 'CREATE_LEAVE',
      entity: 'LeaveRequest',
      entityId: leave._id,
      description: `Applied for ${days} days of ${leaveType} (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
    });

    // Notify HR / Admins
    const hrUsers = await User.find({ role: { $in: ['ADMIN', 'HR'] } }).select('_id');
    for (const hr of hrUsers) {
      await sendNotification({
        recipientId: hr._id,
        title: 'New Leave Request',
        message: `${req.user.employeeId.firstName} ${req.user.employeeId.lastName} requested ${days} days of ${leaveType}.`,
        type: 'LEAVE_SUBMITTED',
        link: '/leaves',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record.',
      });
    }

    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      employeeId: req.user.employeeId._id,
      year: currentYear,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId: req.user.employeeId._id,
        year: currentYear,
      });
    }

    const requests = await LeaveRequest.find({
      employeeId: req.user.employeeId._id,
    })
      .populate('reviewedBy', 'email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        balance,
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeavesList = async (req, res, next) => {
  try {
    const { status, leaveType, department, employeeId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employeeId) query.employeeId = employeeId;

    const requests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName email designation department employeeCode')
      .populate('reviewedBy', 'email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}.`,
      });
    }

    leave.status = 'APPROVED';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Side Effect 1: Deduct Leave Balance
    const year = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      employeeId: leave.employeeId._id,
      year,
    });

    if (balance) {
      const key = getLeaveTypeKey(leave.leaveType);
      balance[key].used += leave.numberOfDays;
      await balance.save();
    }

    // Side Effect 2: Add Attendance ON_LEAVE records for the date range
    let curr = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      await Attendance.findOneAndUpdate(
        { employeeId: leave.employeeId._id, date: dateStr },
        { status: 'ON_LEAVE', notes: `Approved ${leave.leaveType}` },
        { upsert: true, new: true }
      );
      curr.setDate(curr.getDate() + 1);
    }

    // Side Effect 3: Create Calendar Event
    await CalendarEvent.create({
      title: `${leave.employeeId.firstName} ${leave.employeeId.lastName} — ${leave.leaveType}`,
      description: `Leave: ${leave.reason}`,
      startDate: leave.startDate,
      endDate: leave.endDate,
      eventType: 'LEAVE',
      visibility: 'PUBLIC',
      employeeId: leave.employeeId._id,
      createdBy: req.user._id,
    });

    // Side Effect 4: Notify Employee
    const employeeUser = await User.findOne({ employeeId: leave.employeeId._id });
    if (employeeUser) {
      await sendNotification({
        recipientId: employeeUser._id,
        title: 'Leave Request Approved',
        message: `Your ${leave.leaveType} request for ${leave.numberOfDays} days has been approved.`,
        type: 'LEAVE_APPROVED',
        link: '/my-leave',
      });
    }

    // Side Effect 5: Log Audit
    await logAudit({
      req,
      user: req.user,
      action: 'APPROVE_LEAVE',
      entity: 'LeaveRequest',
      entityId: leave._id,
      description: `Approved ${leave.numberOfDays} days of ${leave.leaveType} for ${leave.employeeId.firstName} ${leave.employeeId.lastName}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectLeave = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.',
      });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}.`,
      });
    }

    leave.status = 'REJECTED';
    leave.rejectionReason = rejectionReason;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    const employeeUser = await User.findOne({ employeeId: leave.employeeId._id });
    if (employeeUser) {
      await sendNotification({
        recipientId: employeeUser._id,
        title: 'Leave Request Rejected',
        message: `Your ${leave.leaveType} request was rejected. Reason: ${rejectionReason}`,
        type: 'LEAVE_REJECTED',
        link: '/my-leave',
      });
    }

    await logAudit({
      req,
      user: req.user,
      action: 'REJECT_LEAVE',
      entity: 'LeaveRequest',
      entityId: leave._id,
      description: `Rejected leave request for ${leave.employeeId.firstName} ${leave.employeeId.lastName}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled.',
      });
    }

    leave.status = 'CANCELLED';
    await leave.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalance = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.user.employeeId?._id;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    let balance = await LeaveBalance.findOne({ employeeId, year });
    if (!balance) {
      balance = await LeaveBalance.create({ employeeId, year });
    }

    return res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    let balance = await LeaveBalance.findOne({ employeeId, year });
    if (!balance) {
      balance = new LeaveBalance({ employeeId, year });
    }

    Object.assign(balance, req.body);
    await balance.save();

    return res.status(200).json({
      success: true,
      message: 'Leave balance updated successfully',
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};
