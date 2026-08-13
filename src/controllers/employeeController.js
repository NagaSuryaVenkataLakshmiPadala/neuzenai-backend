import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

export const getEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, role, status, employmentType } = req.query;

    const query = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('managerId', 'firstName lastName designation employeeCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Attach user role if needed
    const employeeIds = employees.map((e) => e._id);
    const users = await User.find({ employeeId: { $in: employeeIds } }).select('email role isActive employeeId');
    const userRoleMap = new Map();
    users.forEach((u) => userRoleMap.set(u.employeeId.toString(), { role: u.role, isActive: u.isActive }));

    const data = employees.map((emp) => {
      const uInfo = userRoleMap.get(emp._id.toString()) || { role: 'EMPLOYEE', isActive: true };
      return {
        ...emp.toObject(),
        role: uInfo.role,
        isUserActive: uInfo.isActive,
      };
    });

    return res.status(200).json({
      success: true,
      data,
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

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      'managerId',
      'firstName lastName designation email phone employeeCode'
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.',
      });
    }

    const user = await User.findOne({ employeeId: employee._id }).select('email role isActive lastLogin');

    return res.status(200).json({
      success: true,
      data: {
        ...employee.toObject(),
        userAccount: user || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      employmentType,
      workLocation,
      role = 'EMPLOYEE',
      baseSalary = 60000,
      password = 'Employee@123',
      emergencyContact,
      bankDetails,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Auto-generate employeeCode if not provided
    const count = await Employee.countDocuments();
    const employeeCode = req.body.employeeCode || `NEU-${String(1001 + count).padStart(4, '0')}`;

    const newEmployee = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      joiningDate: joiningDate || new Date(),
      employmentType,
      workLocation,
      emergencyContact,
      bankDetails,
      status: 'ACTIVE',
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      employeeId: newEmployee._id,
      isActive: true,
    });

    // Create Leave Balance
    await LeaveBalance.create({
      employeeId: newEmployee._id,
      year: new Date().getFullYear(),
    });

    // Create default Salary Structure
    if (baseSalary) {
      await SalaryStructure.create({
        employeeId: newEmployee._id,
        baseSalary: Number(baseSalary),
        allowances: {
          hra: Math.round(baseSalary * 0.2),
          transport: 2400,
          medical: 1200,
        },
        deductions: {
          pf: Math.round(baseSalary * 0.1),
          tax: Math.round(baseSalary * 0.12),
          insurance: 1200,
        },
        createdBy: req.user._id,
      });
    }

    await logAudit({
      req,
      user: req.user,
      action: 'CREATE_EMPLOYEE',
      entity: 'Employee',
      entityId: newEmployee._id,
      description: `Created new employee ${newEmployee.firstName} ${newEmployee.lastName} (${employeeCode})`,
      newValue: newEmployee.toObject(),
    });

    await sendNotification({
      recipientId: newUser._id,
      title: 'Welcome to NEUZEN AI HRMS',
      message: `Your employee profile (${employeeCode}) has been created successfully. Welcome aboard!`,
      type: 'SYSTEM',
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee: newEmployee,
        user: { id: newUser._id, email: newUser.email, role: newUser.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const oldValue = employee.toObject();
    Object.assign(employee, req.body);
    await employee.save();

    await logAudit({
      req,
      user: req.user,
      action: 'UPDATE_EMPLOYEE',
      entity: 'Employee',
      entityId: employee._id,
      description: `Updated profile details for employee ${employee.firstName} ${employee.lastName}`,
      oldValue,
      newValue: employee.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: 'Employee details updated successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    employee.status = status;
    await employee.save();

    const user = await User.findOne({ employeeId: employee._id });
    if (user) {
      user.isActive = status === 'ACTIVE';
      await user.save();
    }

    await logAudit({
      req,
      user: req.user,
      action: 'UPDATE_EMPLOYEE',
      entity: 'Employee',
      entityId: employee._id,
      description: `Changed account status of ${employee.firstName} ${employee.lastName} to ${status}`,
    });

    return res.status(200).json({
      success: true,
      message: `Employee status changed to ${status}`,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'HR', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified.',
      });
    }

    const user = await User.findOne({ employeeId: req.params.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user account not found.',
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit({
      req,
      user: req.user,
      action: 'CHANGE_ROLE',
      entity: 'User',
      entityId: user._id,
      description: `Changed role of user ${user.email} from ${oldRole} to ${role}`,
    });

    return res.status(200).json({
      success: true,
      message: `Role successfully updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
