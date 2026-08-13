import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    casual: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
    },
    sick: {
      total: { type: Number, default: 10 },
      used: { type: Number, default: 0 },
    },
    earned: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
    },
    maternity: {
      total: { type: Number, default: 180 },
      used: { type: Number, default: 0 },
    },
    paternity: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
    },
    unpaid: {
      total: { type: Number, default: 30 },
      used: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
