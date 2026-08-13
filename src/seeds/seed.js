import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Onboarding } from '../models/Onboarding.js';
import { OfferLetter } from '../models/OfferLetter.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { Payroll } from '../models/Payroll.js';
import { Holiday } from '../models/Holiday.js';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { Settings } from '../models/Settings.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neuzen_hrms';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB for seeding database...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Onboarding.deleteMany({}),
      OfferLetter.deleteMany({}),
      Attendance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      LeaveBalance.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Payroll.deleteMany({}),
      Holiday.deleteMany({}),
      CalendarEvent.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing records.');

    // 1. Create Default Settings
    const settings = await Settings.create({
      companyName: 'NEUZEN AI',
      companyEmail: 'hr@neuzen.ai',
      companyPhone: '+1 (800) 555-NEUZEN',
      companyAddress: '100 AI Innovation Way, Suite 400, Tech City',
      timezone: 'America/New_York',
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      lateThresholdMinutes: 15,
      currency: 'INR (₹)',
      payrollPayday: 28,
    });


    // Passwords (updated credentials)
    const adminPassHash = await bcrypt.hash('Admin@987', 10);
    const hrPassHash = await bcrypt.hash('Hr@987', 10);
    const empPassHash = await bcrypt.hash('Employee@12345', 10);

    // 2. Create Core Employees with Role-Based CTCs
    const adminEmp = await Employee.create({
      employeeCode: 'NEU-1001',
      firstName: 'Lakshmi',
      lastName: 'Devi',
      email: 'admin@neuzen.ai',
      phone: '+1 (555) 019-2831',
      dateOfBirth: new Date('1988-04-12'),
      gender: 'Female',
      department: 'Engineering',
      designation: 'Chief Technology Officer',
      baseSalary: 2850000,
      joiningDate: new Date('2022-01-10'),
      employmentType: 'Full-time',
      workLocation: 'Headquarters',
      status: 'ACTIVE',
      emergencyContact: { name: 'Srinivas Devi', relationship: 'Spouse', phone: '+1 (555) 019-2832' },
      bankDetails: { accountHolder: 'Lakshmi Devi', accountNumber: '99281736201', ifscCode: 'CHASEUS33', bankName: 'Chase Bank' },
    });

    const hrEmp = await Employee.create({
      employeeCode: 'NEU-1002',
      firstName: 'Keerthi',
      lastName: 'Reddy',
      email: 'hr@neuzen.ai',
      phone: '+1 (555) 014-9922',
      dateOfBirth: new Date('1992-08-25'),
      gender: 'Female',
      department: 'Human Resources',
      designation: 'Head of People & Culture',
      baseSalary: 2100000,
      joiningDate: new Date('2022-03-15'),
      employmentType: 'Full-time',
      workLocation: 'Headquarters',
      status: 'ACTIVE',
      emergencyContact: { name: 'Kiran Reddy', relationship: 'Brother', phone: '+1 (555) 014-9923' },
      bankDetails: { accountHolder: 'Keerthi Reddy', accountNumber: '77129481029', ifscCode: 'BOAUSA44', bankName: 'Bank of America' },
    });

    const primaryEmp = await Employee.create({
      employeeCode: 'NEU-1003',
      firstName: 'Rachana',
      lastName: 'Sharma',
      email: 'employee@neuzen.ai',
      phone: '+1 (555) 012-7711',
      dateOfBirth: new Date('1995-11-03'),
      gender: 'Female',
      department: 'Engineering',
      designation: 'Senior Full Stack Engineer',
      baseSalary: 1350000,
      managerId: adminEmp._id,
      joiningDate: new Date('2023-02-01'),
      employmentType: 'Full-time',
      workLocation: 'Headquarters',
      status: 'ACTIVE',
      emergencyContact: { name: 'Ramesh Sharma', relationship: 'Father', phone: '+1 (555) 012-7712' },
      bankDetails: { accountHolder: 'Rachana Sharma', accountNumber: '11029384756', ifscCode: 'WELLSF22', bankName: 'Wells Fargo' },
    });

    // Additional Experienced & Fresher Employees (Role-Based Salaries)
    // Valid departments: ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations']
    const extraEmpsData = [
      {
        employeeCode: 'NEU-1004',
        firstName: 'Siri',
        lastName: 'Anaparthi',
        email: 'siri.a@neuzen.ai',
        phone: '+1 (555) 018-3344',
        department: 'Engineering',
        designation: 'AI Infrastructure Lead',
        managerId: adminEmp._id,
        joiningDate: new Date('2023-05-10'),
        baseSalary: 1680000,
      },
      {
        employeeCode: 'NEU-1005',
        firstName: 'Chandu',
        lastName: 'Chowdary',
        email: 'chandu.c@neuzen.ai',
        phone: '+1 (555) 016-5511',
        department: 'Marketing',
        designation: 'Growth Marketing Manager',
        managerId: hrEmp._id,
        joiningDate: new Date('2023-08-20'),
        baseSalary: 1150000,
      },
      {
        employeeCode: 'NEU-1006',
        firstName: 'Mahesh',
        lastName: 'Babu',
        email: 'mahesh.b@neuzen.ai',
        phone: '+1 (555) 017-8899',
        department: 'Finance',
        designation: 'Financial Planning Analyst',
        joiningDate: new Date('2023-11-01'),
        baseSalary: 1020000,
      },
      {
        employeeCode: 'NEU-1007',
        firstName: 'Nagi',
        lastName: 'Reddy',
        email: 'nagi.reddy@neuzen.ai',
        phone: '+1 (555) 019-4477',
        department: 'Operations',
        designation: 'Director of Global Operations',
        managerId: adminEmp._id,
        joiningDate: new Date('2024-01-10'),
        baseSalary: 2250000,
      },
      {
        employeeCode: 'NEU-1008',
        firstName: 'Sunitha',
        lastName: 'Rao',
        email: 'sunitha.rao@neuzen.ai',
        phone: '+1 (555) 015-6633',
        department: 'Engineering',
        designation: 'Lead Product Designer',
        joiningDate: new Date('2024-02-15'),
        baseSalary: 1380000,
      },
      {
        employeeCode: 'NEU-1009',
        firstName: 'Satya',
        lastName: 'Reddy',
        email: 'satya.reddy@neuzen.ai',
        phone: '+1 (555) 013-8822',
        department: 'Engineering',
        designation: 'Principal Cloud Architect',
        managerId: adminEmp._id,
        joiningDate: new Date('2024-03-01'),
        baseSalary: 2400000,
      },
      {
        employeeCode: 'NEU-1010',
        firstName: 'Naveena',
        lastName: 'Kumari',
        email: 'naveena.k@neuzen.ai',
        phone: '+1 (555) 011-9944',
        department: 'Engineering',
        designation: 'Senior QA Automation Engineer',
        joiningDate: new Date('2024-04-12'),
        baseSalary: 960000,
      },
      {
        employeeCode: 'NEU-1011',
        firstName: 'Kalyani',
        lastName: 'Varma',
        email: 'kalyani.v@neuzen.ai',
        phone: '+1 (555) 012-3322',
        department: 'Marketing',
        designation: 'Lead UI/UX Designer',
        joiningDate: new Date('2024-05-01'),
        baseSalary: 1420000,
      },
      {
        employeeCode: 'NEU-1012',
        firstName: 'Chandra',
        lastName: 'Sekhar',
        email: 'chandra.s@neuzen.ai',
        phone: '+1 (555) 014-5588',
        department: 'Engineering',
        designation: 'Senior Backend Engineer',
        managerId: adminEmp._id,
        joiningDate: new Date('2024-06-15'),
        baseSalary: 1500000,
      },
      {
        employeeCode: 'NEU-1013',
        firstName: 'Shiva',
        lastName: 'Reddy',
        email: 'shiva.reddy@neuzen.ai',
        phone: '+1 (555) 016-7744',
        department: 'Operations',
        designation: 'Security & Compliance Officer',
        joiningDate: new Date('2024-07-01'),
        baseSalary: 1850000,
      },
      // FRESHER ROLES (Graduate Trainees & Junior Engineers)
      {
        employeeCode: 'NEU-1014',
        firstName: 'Phani',
        lastName: 'Kumar',
        email: 'phani.k@neuzen.ai',
        phone: '+1 (555) 018-8811',
        department: 'Engineering',
        designation: 'Graduate Software Trainee',
        managerId: primaryEmp._id,
        joiningDate: new Date('2024-08-01'),
        employmentType: 'Full-time',
        baseSalary: 450000,
      },
      {
        employeeCode: 'NEU-1015',
        firstName: 'Kavya',
        lastName: 'Sri',
        email: 'kavya.sri@neuzen.ai',
        phone: '+1 (555) 019-2233',
        department: 'Engineering',
        designation: 'Junior Frontend Developer',
        managerId: primaryEmp._id,
        joiningDate: new Date('2024-08-01'),
        employmentType: 'Full-time',
        baseSalary: 480000,
      },
      {
        employeeCode: 'NEU-1016',
        firstName: 'Gayatri',
        lastName: 'Devi',
        email: 'gayatri.d@neuzen.ai',
        phone: '+1 (555) 017-4499',
        department: 'Human Resources',
        designation: 'Junior HR Operations Associate',
        managerId: hrEmp._id,
        joiningDate: new Date('2024-08-10'),
        employmentType: 'Full-time',
        baseSalary: 420000,
      },
    ];

    const extraEmps = [];
    for (const data of extraEmpsData) {
      const emp = await Employee.create({
        ...data,
        status: 'ACTIVE',
        emergencyContact: { name: 'Emergency Contact', relationship: 'Relative', phone: '+1 (555) 999-0000' },
        bankDetails: { accountHolder: `${data.firstName} ${data.lastName}`, accountNumber: '12345678901', ifscCode: 'BANKIN01', bankName: 'HDFC Bank' },
      });
      extraEmps.push(emp);
    }

    const allEmps = [adminEmp, hrEmp, primaryEmp, ...extraEmps];

    // 3. Create User Accounts
    const adminUser = await User.create({
      email: 'admin@neuzen.ai',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      employeeId: adminEmp._id,
    });

    const hrUser = await User.create({
      email: 'hr@neuzen.ai',
      passwordHash: hrPassHash,
      role: 'HR',
      employeeId: hrEmp._id,
    });

    const empUser = await User.create({
      email: 'employee@neuzen.ai',
      passwordHash: empPassHash,
      role: 'EMPLOYEE',
      employeeId: primaryEmp._id,
    });

    for (const emp of extraEmps) {
      await User.create({
        email: emp.email,
        passwordHash: empPassHash,
        role: 'EMPLOYEE',
        employeeId: emp._id,
      });
    }
    console.log('[Seed] Created User Accounts for Experienced & Fresher Team (Phani, Kavya, Gayatri).');

    // 4. Create Salary Structures & Leave Balances for all employees
    const currentYear = new Date().getFullYear();
    for (const emp of allEmps) {
      await LeaveBalance.create({
        employeeId: emp._id,
        year: currentYear,
        casual: { total: 12, used: 2 },
        sick: { total: 10, used: 1 },
        earned: { total: 15, used: 0 },
      });

      const baseSalary = emp.baseSalary || 600000;
      await SalaryStructure.create({
        employeeId: emp._id,
        baseSalary,
        allowances: {
          hra: Math.round(baseSalary * 0.2),
          transport: 24000,
          medical: 15000,
        },
        deductions: {
          pf: Math.round(baseSalary * 0.1),
          tax: Math.round(baseSalary * 0.12),
          insurance: 12000,
        },
        createdBy: hrUser._id,
      });
    }

    // 5. Seed Attendance for the past 14 days
    console.log('[Seed] Generating past 14 days of attendance history...');
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      for (const emp of allEmps) {
        const checkIn = new Date(d);
        checkIn.setHours(9, 10 + Math.floor(Math.random() * 20), 0);

        const checkOut = new Date(d);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0);

        const hours = 8.5 + (Math.random() * 0.5);

        await Attendance.create({
          employeeId: emp._id,
          date: dateStr,
          checkIn,
          checkOut,
          workingHours: Math.round(hours * 100) / 100,
          status: checkIn.getMinutes() > 15 ? 'LATE' : 'PRESENT',
        });
      }
    }

    // 6. Seed Leave Requests
    await LeaveRequest.create({
      employeeId: primaryEmp._id,
      leaveType: 'Casual Leave',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      numberOfDays: 3,
      reason: 'Personal family event',
      status: 'APPROVED',
      reviewedBy: hrUser._id,
      reviewedAt: new Date(),
    });

    await LeaveRequest.create({
      employeeId: extraEmps[0]._id,
      leaveType: 'Sick Leave',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      numberOfDays: 2,
      reason: 'Scheduled medical appointment',
      status: 'PENDING',
    });

    // 7. Seed Payroll Records for previous month (Role & Experience Tiered Net Salary)
    const prevMonth = currentYear === 2026 && new Date().getMonth() === 0 ? 12 : new Date().getMonth();
    const prevYear = prevMonth === 12 ? currentYear - 1 : currentYear;

    for (const emp of allEmps) {
      const annualBase = emp.baseSalary || 600000;
      const monthlyBase = Math.round(annualBase / 12);

      // Experience Tier Calculation (Freshers vs Mid-Level vs Senior Executive Leads)
      let taxDeductionRate = 0.12; // Mid-Level (2-5 yrs)
      let allowanceRate = 0.25;
      let bonusRate = 0.05;

      if (annualBase >= 1600000) {
        // Senior Executive & Architect Tier (5+ yrs experience)
        taxDeductionRate = 0.16; // Higher tax bracket + PF
        allowanceRate = 0.30;    // Executive Allowances & HRA
        bonusRate = 0.08;       // Lead Performance Incentive
      } else if (annualBase <= 500000) {
        // Fresher Tier (< 1 yr experience)
        taxDeductionRate = 0.05; // Basic Tax Exemption + PF Only
        allowanceRate = 0.20;    // Graduate Allowances
        bonusRate = 0.03;       // Trainee Stipend Bonus
      }

      const allowances = Math.round(monthlyBase * allowanceRate);
      const bonus = Math.round(monthlyBase * bonusRate);
      const grossSalary = monthlyBase + allowances + bonus;
      const deductions = Math.round(grossSalary * taxDeductionRate);
      const netSalary = grossSalary - deductions;

      await Payroll.create({
        employeeId: emp._id,
        month: prevMonth,
        year: prevYear,
        baseSalary: monthlyBase,
        allowances,
        bonus,
        grossSalary,
        deductions,
        netSalary,
        paymentDate: new Date(),
        status: 'PAID',
        approvedBy: adminUser._id,
        approvedAt: new Date(),
      });
    }

    // 8. Seed Onboarding & Offer Letter for Fresher (Phani) & Experienced (Satya)
    const fresherPhani = extraEmps[extraEmps.length - 3];
    const experiencedSatya = extraEmps[5]; // Satya Reddy

    await Onboarding.create({
      employeeId: fresherPhani._id,
      position: fresherPhani.designation,
      department: fresherPhani.department,
      candidateType: 'FRESHER',
      joiningDate: fresherPhani.joiningDate,
      assignedHrId: hrUser._id,
      status: 'IN_PROGRESS',
      progress: 50,
      documents: [
        { docType: 'RESUME', name: 'Resume / CV', isMandatory: true, status: 'VERIFIED', fileName: 'Phani_Resume.pdf' },
        { docType: 'AADHAAR', name: 'Aadhaar Card (ID Proof)', isMandatory: true, status: 'VERIFIED', fileName: 'Aadhaar_Phani.pdf' },
        { docType: 'PC', name: 'Provisional Certificate (PC)', isMandatory: true, status: 'SUBMITTED', fileName: 'PC_BTech_Degree.pdf' },
        { docType: 'CMM', name: 'Consolidated Marks Memo (CMM)', isMandatory: true, status: 'PENDING' },
      ],
      notes: 'Fresher candidate onboarded. Aadhaar verified. Awaiting CMM submission.',
    });

    await Onboarding.create({
      employeeId: experiencedSatya._id,
      position: experiencedSatya.designation,
      department: experiencedSatya.department,
      candidateType: 'EXPERIENCED',
      joiningDate: experiencedSatya.joiningDate,
      assignedHrId: hrUser._id,
      status: 'DOCUMENT_PENDING',
      progress: 60,
      documents: [
        { docType: 'RESUME', name: 'Resume / CV', isMandatory: true, status: 'VERIFIED', fileName: 'Satya_CV_Cloud.pdf' },
        { docType: 'AADHAAR', name: 'Aadhaar Card (ID Proof)', isMandatory: true, status: 'VERIFIED', fileName: 'Aadhaar_Satya.pdf' },
        { docType: 'PC', name: 'Provisional Certificate (PC)', isMandatory: true, status: 'VERIFIED', fileName: 'Satya_Degree.pdf' },
        { docType: 'CMM', name: 'Consolidated Marks Memo (CMM)', isMandatory: true, status: 'VERIFIED', fileName: 'Satya_CMM.pdf' },
        { docType: 'RELIEVING_LETTER', name: 'Relieving Letter / Experience Certificate', isMandatory: true, status: 'SUBMITTED', fileName: 'Relieving_Letter_PrevCompany.pdf' },
        { docType: 'PAYSLIPS', name: 'Previous Company Payslips (3 Months)', isMandatory: true, status: 'PENDING' },
      ],
      notes: 'Experienced Principal Architect onboarded. Experience certificate submitted. Awaiting 3-month payslips.',
    });

    await OfferLetter.create({
      employeeId: fresherPhani._id,
      candidateName: `${fresherPhani.firstName} ${fresherPhani.lastName}`,
      position: fresherPhani.designation,
      department: fresherPhani.department,
      joiningDate: fresherPhani.joiningDate,
      employmentType: 'Full-time',
      workLocation: 'Headquarters',
      baseSalary: 450000,
      allowances: 90000,
      probationPeriod: '180 Days (Trainee)',
      offerExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'ACCEPTED',
      generatedBy: hrUser._id,
    });

    // 9. Seed Company Holidays
    await Holiday.insertMany([
      { name: 'New Year’s Day', date: new Date('2026-01-01'), description: 'Public Holiday', location: 'All Locations', createdBy: adminUser._id },
      { name: 'Republic Day', date: new Date('2026-01-26'), description: 'National Holiday', location: 'All Locations', createdBy: adminUser._id },
      { name: 'Independence Day', date: new Date('2026-08-15'), description: 'National Holiday', location: 'All Locations', createdBy: adminUser._id },
      { name: 'Diwali', date: new Date('2026-11-08'), description: 'Festival Holiday', location: 'All Locations', createdBy: adminUser._id },
    ]);

    // 10. Seed Calendar Events
    await CalendarEvent.create({
      title: 'NEUZEN AI Quarterly All-Hands Meeting',
      description: 'Company-wide town hall & roadmap presentation',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      eventType: 'COMPANY_EVENT',
      visibility: 'PUBLIC',
      createdBy: adminUser._id,
      location: 'Main Auditorium & Zoom',
    });

    // 11. Seed Notifications & Audit Logs
    await Notification.create({
      recipientId: empUser._id,
      title: 'Monthly Payslip Available',
      message: `Your payslip for ${prevMonth}/${prevYear} is now ready for download.`,
      type: 'PAYROLL_APPROVED',
      isRead: false,
      link: '/my-payslips',
    });

    await AuditLog.create({
      userId: adminUser._id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: String(adminUser._id),
      description: 'System administrator initial setup session',
      ipAddress: '127.0.0.1',
    });

    console.log('[Seed] Database successfully populated with 16 employees including freshers Phani, Kavya, Gayatri!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDB();
