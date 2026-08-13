import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true, // 1 to 12
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PROCESSING', 'REVIEW', 'APPROVED', 'PAID', 'CANCELLED'],
      default: 'DRAFT',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    payslipUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model('Payroll', payrollSchema);
