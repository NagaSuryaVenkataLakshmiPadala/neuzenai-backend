import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';

export const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveReport = async (req, res, next) => {
  try {
    const { status, leaveType, department } = req.query;
    const query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    const query = {};

    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);

    if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const records = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeReport = async (req, res, next) => {
  try {
    const { department, status, employmentType } = req.query;
    const query = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;

    const records = await Employee.find(query).sort({ firstName: 1 });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};
