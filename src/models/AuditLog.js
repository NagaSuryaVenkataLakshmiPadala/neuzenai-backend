import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    userRole: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'CREATE_EMPLOYEE',
        'UPDATE_EMPLOYEE',
        'CHANGE_ROLE',
        'CREATE_ONBOARDING',
        'UPDATE_ONBOARDING',
        'GENERATE_OFFER',
        'CREATE_LEAVE',
        'APPROVE_LEAVE',
        'REJECT_LEAVE',
        'CORRECT_ATTENDANCE',
        'GENERATE_PAYROLL',
        'APPROVE_PAYROLL',
        'GENERATE_PAYSLIP',
        'CREATE_HOLIDAY',
        'CREATE_EVENT',
        'UPDATE_SETTINGS',
      ],
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
