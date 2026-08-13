import { OfferLetter } from '../models/OfferLetter.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { generateOfferLetterPDF } from '../services/pdfService.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

export const getOfferLetters = async (req, res, next) => {
  try {
    const offerLetters = await OfferLetter.find()
      .populate('employeeId', 'firstName lastName email designation employeeCode department')
      .populate('generatedBy', 'email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: offerLetters,
    });
  } catch (error) {
    next(error);
  }
};

export const getOfferLetterById = async (req, res, next) => {
  try {
    const offer = await OfferLetter.findById(req.params.id)
      .populate('employeeId')
      .populate('generatedBy', 'email role');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const createOfferLetter = async (req, res, next) => {
  try {
    const {
      employeeId,
      candidateName,
      position,
      department,
      joiningDate,
      employmentType,
      workLocation,
      baseSalary,
      allowances,
      probationPeriod,
      offerExpiryDate,
    } = req.body;

    const offer = await OfferLetter.create({
      employeeId,
      candidateName,
      position,
      department,
      joiningDate: joiningDate || new Date(),
      employmentType,
      workLocation,
      baseSalary: Number(baseSalary),
      allowances: Number(allowances || 0),
      probationPeriod,
      offerExpiryDate: offerExpiryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      generatedBy: req.user._id,
      status: 'GENERATED',
    });

    await logAudit({
      req,
      user: req.user,
      action: 'GENERATE_OFFER',
      entity: 'OfferLetter',
      entityId: offer._id,
      description: `Generated formal offer letter for candidate ${candidateName}`,
    });

    // Send Notification to Employee Header Notification Bar
    if (employeeId) {
      const targetUser = await User.findOne({ employeeId });
      if (targetUser) {
        await sendNotification({
          recipientId: targetUser._id,
          title: '🎉 Formal Offer Letter Generated',
          message: `HR has issued your formal Offer Letter for position ${position}. Download your PDF copy.`,
          type: 'ONBOARDING_UPDATE',
          link: '/onboarding',
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Offer letter generated successfully',
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadOfferLetterPDF = async (req, res, next) => {
  try {
    const offer = await OfferLetter.findById(req.params.id).populate('employeeId');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter record not found.',
      });
    }

    const pdfBuffer = await generateOfferLetterPDF(offer);

    const safeFilename = `NEUZEN_AI_Offer_${offer.candidateName.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const updateOfferLetterStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const offer = await OfferLetter.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found.',
      });
    }

    offer.status = status;
    await offer.save();

    if (offer.employeeId) {
      const targetUser = await User.findOne({ employeeId: offer.employeeId });
      if (targetUser) {
        await sendNotification({
          recipientId: targetUser._id,
          title: `Offer Letter Status: ${status}`,
          message: `Your offer letter status was updated to ${status}.`,
          type: 'ONBOARDING_UPDATE',
          link: '/onboarding',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Offer letter status changed to ${status}`,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};
