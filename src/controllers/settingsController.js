import { Settings } from '../models/Settings.js';
import { logAudit } from '../services/auditService.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    Object.assign(settings, req.body);
    await settings.save();

    await logAudit({
      req,
      user: req.user,
      action: 'UPDATE_SETTINGS',
      entity: 'Settings',
      entityId: settings._id,
      description: 'Updated system organization & HR settings',
    });

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
