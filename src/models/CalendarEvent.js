import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['LEAVE', 'HOLIDAY', 'ONBOARDING', 'MEETING', 'COMPANY_EVENT'],
      default: 'COMPANY_EVENT',
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE', 'HR_ONLY'],
      default: 'PUBLIC',
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
