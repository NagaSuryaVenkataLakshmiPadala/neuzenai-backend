import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { generatePayslipPDF } from '../services/pdfService.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';
import { User } from '../models/User.js';

export const getPayrollList = async (req, res, next) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const { status, department } = req.query;

    const query = {};
    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status;

    if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName email employeeCode designation department')
      .populate('approvedBy', 'email role')
      .sort({ year: -1, month: -1, createdAt: -1 });

    const totalGross = payrolls.reduce((acc, p) => acc + p.grossSalary, 0);
    const totalDeductions = payrolls.reduce((acc, p) => acc + p.deductions, 0);
    const totalNet = payrolls.reduce((acc, p) => acc + p.netSalary, 0);

    return res.status(200).json({
      success: true,
      data: payrolls,
      summary: {
        count: payrolls.length,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayroll = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile.',
      });
    }

    const payrolls = await Payroll.find({
      employeeId: req.user.employeeId._id,
      status: { $in: ['APPROVED', 'PAID'] },
    })
      .populate('employeeId', 'firstName lastName email employeeCode designation department baseSalary')
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId')
      .populate('approvedBy', 'email role');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found.',
      });
    }

    // Check authorization for employees
    if (
      req.user.role === 'EMPLOYEE' &&
      req.user.employeeId &&
      payroll.employeeId._id.toString() !== req.user.employeeId._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own payroll record.',
      });
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const processBatchPayroll = async (req, res, next) => {
  try {
    const { month, year, bonusMap = {} } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please specify month and year for payroll processing.',
      });
    }

    const activeEmployees = await Employee.find({ status: 'ACTIVE' });
    const processed = [];
    const skipped = [];

    for (const emp of activeEmployees) {
      // Check duplicate
      const existing = await Payroll.findOne({ employeeId: emp._id, month, year });
      if (existing) {
        skipped.push({ employee: `${emp.firstName} ${emp.lastName}`, reason: 'Already processed for this month' });
        continue;
      }

      // Use employee's actual CTC with experience-tier rates
      const annualBase = emp.baseSalary || 600000;
      const monthlyBase = Math.round(annualBase / 12);

      // Experience Tier logic (mirrors seed.js)
      let taxRate = 0.12;
      let allowanceRate = 0.25;
      let bonusRate = 0.05;

      if (annualBase >= 1600000) {
        // Senior Executive & Architect Tier (5+ yrs)
        taxRate = 0.16;
        allowanceRate = 0.30;
        bonusRate = 0.08;
      } else if (annualBase <= 500000) {
        // Fresher Tier (< 1 yr)
        taxRate = 0.05;
        allowanceRate = 0.20;
        bonusRate = 0.03;
      }

      const totalAllowances = Math.round(monthlyBase * allowanceRate);
      const empBonus = Number(bonusMap[emp._id.toString()] || 0) || Math.round(monthlyBase * bonusRate);
      const totalDeductions = Math.round((monthlyBase + totalAllowances + empBonus) * taxRate);

      const grossSalary = monthlyBase + totalAllowances + empBonus;
      const netSalary = grossSalary - totalDeductions;

      const record = await Payroll.create({
        employeeId: emp._id,
        month,
        year,
        baseSalary: monthlyBase,
        allowances: totalAllowances,
        bonus: empBonus,
        grossSalary,
        deductions: totalDeductions,
        netSalary,
        status: 'PROCESSING',
      });

      processed.push(record);
    }

    await logAudit({
      req,
      user: req.user,
      action: 'GENERATE_PAYROLL',
      entity: 'Payroll',
      description: `Processed payroll batch for ${month}/${year}. Created: ${processed.length}, Skipped: ${skipped.length}`,
    });

    return res.status(201).json({
      success: true,
      message: `Payroll batch processed for ${month}/${year}`,
      data: {
        createdCount: processed.length,
        skippedCount: skipped.length,
        processed,
        skipped,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollDraft = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found.',
      });
    }

    if (payroll.status === 'APPROVED' || payroll.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Approved or paid payroll records cannot be edited.',
      });
    }

    const { baseSalary, allowances, bonus, deductions } = req.body;

    if (baseSalary !== undefined) payroll.baseSalary = Number(baseSalary);
    if (allowances !== undefined) payroll.allowances = Number(allowances);
    if (bonus !== undefined) payroll.bonus = Number(bonus);
    if (deductions !== undefined) payroll.deductions = Number(deductions);

    payroll.grossSalary = payroll.baseSalary + payroll.allowances + payroll.bonus;
    payroll.netSalary = payroll.grossSalary - payroll.deductions;

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: 'Payroll record updated',
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employeeId');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found.',
      });
    }

    payroll.status = 'APPROVED';
    payroll.paymentDate = new Date();
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    // Side Effect: Notify Employee
    const empUser = await User.findOne({ employeeId: payroll.employeeId._id });
    if (empUser) {
      await sendNotification({
        recipientId: empUser._id,
        title: 'Monthly Payslip Available',
        message: `Your payslip for ${payroll.month}/${payroll.year} (Net: ₹${payroll.netSalary.toLocaleString('en-IN')}) has been generated.`,
        type: 'PAYROLL_APPROVED',
        link: '/my-payslips',
      });
    }

    await logAudit({
      req,
      user: req.user,
      action: 'APPROVE_PAYROLL',
      entity: 'Payroll',
      entityId: payroll._id,
      description: `Approved payroll record for ${payroll.employeeId.firstName} ${payroll.employeeId.lastName} (${payroll.month}/${payroll.year})`,
    });

    return res.status(200).json({
      success: true,
      message: 'Payroll approved and payslip generated',
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPayslipPDF = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employeeId');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found.',
      });
    }

    if (
      req.user.role === 'EMPLOYEE' &&
      req.user.employeeId &&
      payroll.employeeId._id.toString() !== req.user.employeeId._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only download your own payslip.',
      });
    }

    const pdfBuffer = await generatePayslipPDF(payroll, payroll.employeeId);

    const safeFilename = `NEUZEN_AI_Payslip_${payroll.employeeId.employeeCode}_${payroll.year}-${String(payroll.month).padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
