import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import offerLetterRoutes from './routes/offerLetterRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        const isAllowed = allowedOrigins.some(
          (allowed) => origin === allowed || origin === allowed.replace(/\/$/, '')
        ) || hostname.endsWith('.vercel.app') || hostname === 'localhost';

        if (isAllowed) {
          return callback(null, true);
        }
      } catch (err) {
        // Fall through to error
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/offer-letters', offerLetterRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/leave-balances', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payslips', payrollRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Error Handler
app.use(errorHandler);

export default app;
