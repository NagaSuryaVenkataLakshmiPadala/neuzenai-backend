import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token missing. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'neuzen_ai_hrms_super_secret_jwt_key_2026');
    const user = await User.findById(decoded.id).populate('employeeId');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User session invalid or account deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      error: error.message,
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`,
      });
    }
    next();
  };
};

export const verifyResourceOwnership = (paramKey = 'employeeId') => {
  return (req, res, next) => {
    if (['ADMIN', 'HR'].includes(req.user.role)) {
      return next();
    }

    const targetEmployeeId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];
    if (req.user.employeeId && req.user.employeeId._id.toString() === targetEmployeeId?.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only access your own employee records.',
    });
  };
};
