import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    department: {
      type: String,
      required: true,
      enum: ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations'],
    },
    designation: {
      type: String,
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    workLocation: {
      type: String,
      default: 'Headquarters (Remote/Hybrid)',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ONBOARDING', 'TERMINATED'],
      default: 'ACTIVE',
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    baseSalary: {
      type: Number,
      default: 600000,
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.model('Employee', employeeSchema);
