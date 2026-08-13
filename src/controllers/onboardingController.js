import { Onboarding } from '../models/Onboarding.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

export const getOnboardings = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    const onboardings = await Onboarding.find(query)
      .populate('employeeId', 'firstName lastName email designation employeeCode department status')
      .populate('assignedHrId', 'email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: onboardings,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingById = async (req, res, next) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id)
      .populate('employeeId')
      .populate('assignedHrId', 'email role');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    next(error);
  }
};

export const createOnboarding = async (req, res, next) => {
  try {
    const { employeeId, position, department, joiningDate, candidateType = 'FRESHER', notes } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Common Mandatory Documents for ALL Candidates
    const defaultDocuments = [
      { docType: 'RESUME', name: 'Resume / CV', isMandatory: true, status: 'PENDING' },
      { docType: 'AADHAAR', name: 'Aadhaar Card (ID Proof)', isMandatory: true, status: 'PENDING' },
      { docType: 'PC', name: 'Provisional Certificate (PC)', isMandatory: true, status: 'PENDING' },
      { docType: 'CMM', name: 'Consolidated Marks Memo (CMM)', isMandatory: true, status: 'PENDING' },
    ];

    // Additional Documents for EXPERIENCED Candidates
    if (candidateType === 'EXPERIENCED') {
      defaultDocuments.push(
        { docType: 'RELIEVING_LETTER', name: 'Relieving Letter / Experience Certificate', isMandatory: true, status: 'PENDING' },
        { docType: 'PAYSLIPS', name: 'Previous Company Payslips (3 Months)', isMandatory: true, status: 'PENDING' }
      );
    }

    const onboarding = await Onboarding.create({
      employeeId,
      position: position || employee.designation,
      department: department || employee.department,
      candidateType,
      joiningDate: joiningDate || employee.joiningDate,
      assignedHrId: req.user._id,
      status: 'IN_PROGRESS',
      progress: 25,
      documents: defaultDocuments,
      notes,
    });

    employee.status = 'ONBOARDING';
    await employee.save();

    await logAudit({
      req,
      user: req.user,
      action: 'CREATE_ONBOARDING',
      entity: 'Onboarding',
      entityId: onboarding._id,
      description: `Initiated ${candidateType} onboarding workflow for ${employee.firstName} ${employee.lastName}`,
    });

    // Notify Employee in Real-Time Notification Bar
    const targetUser = await User.findOne({ employeeId });
    if (targetUser) {
      await sendNotification({
        recipientId: targetUser._id,
        title: '📋 Onboarding Process Started',
        message: `HR initiated your onboarding (${candidateType}). Please upload your mandatory documents (Resume, Aadhaar, PC, CMM${candidateType === 'EXPERIENCED' ? ', Relieving Letter, & Payslips' : ''}).`,
        type: 'ONBOARDING_UPDATE',
        link: '/onboarding',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Onboarding process initiated',
      data: onboarding,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { docType, status, fileUrl, fileName, rejectionReason } = req.body;

    const onboarding = await Onboarding.findById(id).populate('employeeId');
    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    const docIndex = onboarding.documents.findIndex((d) => d.docType === docType);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: `Document slot for ${docType} not found.` });
    }

    if (status) onboarding.documents[docIndex].status = status;
    if (fileUrl) onboarding.documents[docIndex].fileUrl = fileUrl;
    if (fileName) onboarding.documents[docIndex].fileName = fileName;
    if (rejectionReason) onboarding.documents[docIndex].rejectionReason = rejectionReason;
    if (status === 'SUBMITTED' || status === 'VERIFIED') {
      onboarding.documents[docIndex].uploadedAt = new Date();
    }

    // Recalculate progress percentage
    const totalDocs = onboarding.documents.length;
    const verifiedDocs = onboarding.documents.filter((d) => d.status === 'VERIFIED').length;
    const submittedDocs = onboarding.documents.filter((d) => d.status === 'SUBMITTED').length;

    onboarding.progress = Math.round(25 + ((verifiedDocs * 0.5 + submittedDocs * 0.25) / totalDocs) * 75);

    if (verifiedDocs === totalDocs) {
      onboarding.status = 'VERIFICATION';
    }

    await onboarding.save();

    // Send Notification to Employee Header Notification Bar
    if (onboarding.employeeId) {
      const targetUser = await User.findOne({ employeeId: onboarding.employeeId._id });
      if (targetUser) {
        const docName = onboarding.documents[docIndex].name;
        let notifTitle = `📄 Document Status: ${docName}`;
        let notifMsg = `HR updated your ${docName} to ${status}.`;

        if (status === 'VERIFIED') {
          notifTitle = `✅ Document Verified: ${docName}`;
          notifMsg = `Great news! HR has verified and approved your ${docName}.`;
        } else if (status === 'REJECTED') {
          notifTitle = `⚠️ Document Rejected: ${docName}`;
          notifMsg = `HR rejected your ${docName}. Reason: "${rejectionReason || 'Please re-upload a clearer copy'}".`;
        }

        await sendNotification({
          recipientId: targetUser._id,
          title: notifTitle,
          message: notifMsg,
          type: 'ONBOARDING_UPDATE',
          link: '/onboarding',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Document ${docType} updated to ${status}`,
      data: onboarding,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOnboardingStatus = async (req, res, next) => {
  try {
    const { status, progress, notes } = req.body;
    const onboarding = await Onboarding.findById(req.params.id).populate('employeeId');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found.',
      });
    }

    if (status) onboarding.status = status;
    if (progress !== undefined) onboarding.progress = progress;
    if (notes) onboarding.notes = notes;

    if (status === 'COMPLETED') {
      onboarding.progress = 100;
      if (onboarding.employeeId) {
        onboarding.employeeId.status = 'ACTIVE';
        await onboarding.employeeId.save();
      }
    }

    await onboarding.save();

    await logAudit({
      req,
      user: req.user,
      action: 'UPDATE_ONBOARDING',
      entity: 'Onboarding',
      entityId: onboarding._id,
      description: `Updated onboarding status to ${status} (${onboarding.progress}%)`,
    });

    // Notify Employee Notification Bar
    if (onboarding.employeeId) {
      const targetUser = await User.findOne({ employeeId: onboarding.employeeId._id });
      if (targetUser) {
        await sendNotification({
          recipientId: targetUser._id,
          title: `🎯 Onboarding Stage: ${status.replace(/_/g, ' ')}`,
          message: `HR updated your onboarding progress to ${onboarding.progress}%. Current Stage: ${status.replace(/_/g, ' ')}.`,
          type: 'ONBOARDING_UPDATE',
          link: '/onboarding',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding progress updated',
      data: onboarding,
    });
  } catch (error) {
    next(error);
  }
};
