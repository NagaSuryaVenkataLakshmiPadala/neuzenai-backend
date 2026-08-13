import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logAudit } from '../services/auditService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'neuzen_ai_hrms_super_secret_jwt_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('employeeId');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact system admin.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    await logAudit({
      user,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `User ${user.email} logged in with role ${user.role}`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employee: user.employeeId,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        user: req.user,
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user._id,
        description: `User ${req.user.email} logged out`,
        req,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('employeeId');
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        employee: user.employeeId,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.passwordHash = await import('bcryptjs').then((b) => b.hash(newPassword, 10));
    await user.save();

    await logAudit({
      user,
      action: 'UPDATE_EMPLOYEE',
      entity: 'User',
      entityId: user._id,
      description: `User ${user.email} updated their password`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
