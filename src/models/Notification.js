import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'LEAVE_SUBMITTED',
        'LEAVE_APPROVED',
        'LEAVE_REJECTED',
        'PAYROLL_APPROVED',
        'PAYSLIP_AVAILABLE',
        'ONBOARDING_UPDATE',
        'OFFER_LETTER',
        'CALENDAR_EVENT',
        'HOLIDAY',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
