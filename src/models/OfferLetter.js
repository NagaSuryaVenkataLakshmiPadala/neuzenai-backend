import mongoose from 'mongoose';

const offerLetterSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    candidateName: {
      type: String,
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
    joiningDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      default: 'Full-time',
    },
    workLocation: {
      type: String,
      default: 'Headquarters',
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    probationPeriod: {
      type: String,
      default: '90 Days',
    },
    offerExpiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'DRAFT',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pdfPath: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const OfferLetter = mongoose.model('OfferLetter', offerLetterSchema);
