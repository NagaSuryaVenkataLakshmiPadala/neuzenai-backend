import { Notification } from '../models/Notification.js';

export const sendNotification = async ({ recipientId, title, message, type = 'SYSTEM', link = '' }) => {
  try {
    if (!recipientId) return;

    await Notification.create({
      recipientId,
      title,
      message,
      type,
      link,
      isRead: false,
    });
  } catch (err) {
    console.error('[Notification Service Error]', err.message);
  }
};

export const broadcastToRoles = async ({ roles = ['ADMIN', 'HR'], title, message, type = 'SYSTEM', link = '', User }) => {
  try {
    const recipients = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
    const notifications = recipients.map((r) => ({
      recipientId: r._id,
      title,
      message,
      type,
      link,
      isRead: false,
    }));
    if (notifications.length) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('[Notification Broadcast Error]', err.message);
  }
};
