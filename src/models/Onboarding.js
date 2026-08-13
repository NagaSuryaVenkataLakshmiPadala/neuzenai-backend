import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    candidateType: {
      type: String,
      enum: ['FRESHER', 'EXPERIENCED'],
      default: 'FRESHER',
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    assignedHrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'OFFER_GENERATED',
        'OFFER_SENT',
        'OFFER_ACCEPTED',
        'DOCUMENT_PENDING',
        'VERIFICATION',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'NOT_STARTED',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    documents: [
      {
        docType: {
          type: String,
          enum: ['RESUME', 'AADHAAR', 'PC', 'CMM', 'RELIEVING_LETTER', 'PAYSLIPS', 'OTHER'],
          required: true,
        },
        name: { type: String, required: true },
        isMandatory: { type: Boolean, default: true },
        status: { type: String, enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
        fileUrl: { type: String, default: '' },
        fileName: { type: String, default: '' },
        uploadedAt: { type: Date },
        rejectionReason: { type: String, default: '' },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Onboarding = mongoose.model('Onboarding', onboardingSchema);
