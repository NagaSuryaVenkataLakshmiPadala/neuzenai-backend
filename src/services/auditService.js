import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ req, user, action, entity, entityId, description, oldValue = null, newValue = null }) => {
  try {
    const activeUser = user || req?.user;
    if (!activeUser) return;

    await AuditLog.create({
      userId: activeUser._id,
      userEmail: activeUser.email,
      userRole: activeUser.role,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      description,
      oldValue,
      newValue,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || '127.0.0.1',
    });
  } catch (err) {
    console.error('[Audit Service Error]', err.message);
  }
};
