import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'NEUZEN AI',
    },
    companyEmail: {
      type: String,
      default: 'hr@neuzen.ai',
    },
    companyPhone: {
      type: String,
      default: '+1 (800) 555-NEUZEN',
    },
    companyAddress: {
      type: String,
      default: '100 AI Innovation Way, Suite 400, Tech City',
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    workingHoursStart: {
      type: String,
      default: '09:00',
    },
    workingHoursEnd: {
      type: String,
      default: '18:00',
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15,
    },
    currency: {
      type: String,
      default: 'USD ($)',
    },
    payrollPayday: {
      type: Number,
      default: 28,
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD',
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
