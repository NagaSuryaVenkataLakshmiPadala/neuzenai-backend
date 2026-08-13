import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Onboarding } from '../models/Onboarding.js';
import { Payroll } from '../models/Payroll.js';
import { Holiday } from '../models/Holiday.js';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { LeaveBalance } from '../models/LeaveBalance.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      pendingLeavesCount,
      pendingOnboardingCount,
      currentPayrollAgg,
      deptBreakdown,
      recentActivity,
      upcomingHolidays,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'ACTIVE' }),
      Attendance.find({ date: todayStr }),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      Onboarding.countDocuments({ status: { $in: ['NOT_STARTED', 'IN_PROGRESS', 'OFFER_GENERATED', 'DOCUMENT_PENDING'] } }),
      Payroll.aggregate([
        { $match: { month: currentMonth, year: currentYear } },
        { $group: { _id: null, totalGross: { $sum: '$grossSalary' }, totalNet: { $sum: '$netSalary' } } },
      ]),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(8),
      Holiday.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(4),
    ]);

    const presentToday = todayAttendance.filter((a) => ['PRESENT', 'LATE', 'WORK_FROM_HOME'].includes(a.status)).length;
    const onLeaveToday = todayAttendance.filter((a) => a.status === 'ON_LEAVE').length;
    const lateToday = todayAttendance.filter((a) => a.status === 'LATE').length;
    const wfhToday = todayAttendance.filter((a) => a.status === 'WORK_FROM_HOME').length;
    const absentToday = Math.max(0, activeEmployees - (presentToday + onLeaveToday));

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalEmployees,
          activeEmployees,
          presentToday,
          onLeaveToday,
          pendingLeaves: pendingLeavesCount,
          pendingOnboarding: pendingOnboardingCount,
          monthlyPayroll: currentPayrollAgg[0]?.totalNet || 0,
        },
        attendanceOverview: {
          present: presentToday,
          absent: absentToday,
          late: lateToday,
          wfh: wfhToday,
          onLeave: onLeaveToday,
        },
        departmentDistribution: deptBreakdown.map((d) => ({ department: d._id || 'Unassigned', count: d.count })),
        recentActivity,
        upcomingHolidays,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHrDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalEmployees,
      todayAttendance,
      pendingLeaves,
      onboardings,
      upcomingHolidays,
    ] = await Promise.all([
      Employee.countDocuments({ status: 'ACTIVE' }),
      Attendance.find({ date: todayStr }).populate('employeeId', 'firstName lastName department'),
      LeaveRequest.find({ status: 'PENDING' })
        .populate('employeeId', 'firstName lastName department employeeCode designation')
        .sort({ createdAt: -1 })
        .limit(6),
      Onboarding.find({ status: { $ne: 'COMPLETED' } })
        .populate('employeeId', 'firstName lastName position department')
        .limit(6),
      Holiday.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
    ]);

    const presentToday = todayAttendance.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
    const onLeaveToday = todayAttendance.filter((a) => a.status === 'ON_LEAVE').length;

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalEmployees,
          presentToday,
          onLeaveToday,
          pendingLeavesCount: pendingLeaves.length,
          activeOnboardingsCount: onboardings.length,
        },
        pendingLeaves,
        onboardings,
        upcomingHolidays,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record found.',
      });
    }

    const empId = req.user.employeeId._id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const [
      todayAttendance,
      leaveBalance,
      recentLeaves,
      latestPayroll,
      nextHoliday,
    ] = await Promise.all([
      Attendance.findOne({ employeeId: empId, date: todayStr }),
      LeaveBalance.findOne({ employeeId: empId, year: currentYear }),
      LeaveRequest.find({ employeeId: empId }).sort({ createdAt: -1 }).limit(4),
      Payroll.findOne({ employeeId: empId, status: { $in: ['APPROVED', 'PAID'] } }).sort({ year: -1, month: -1 }),
      Holiday.findOne({ date: { $gte: new Date() } }).sort({ date: 1 }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employee: req.user.employeeId,
        todayAttendance,
        leaveBalance: leaveBalance || {
          casual: { total: 12, used: 0 },
          sick: { total: 10, used: 0 },
          earned: { total: 15, used: 0 },
        },
        recentLeaves,
        latestPayroll,
        nextHoliday,
      },
    });
  } catch (error) {
    next(error);
  }
};
