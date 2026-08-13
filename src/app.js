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

app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes mounted with /api prefix and fallback prefix
const mountRoutes = (prefix = '/api') => {
  app.use(`${prefix}/health`, healthRoutes);
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/employees`, employeeRoutes);
  app.use(`${prefix}/onboarding`, onboardingRoutes);
  app.use(`${prefix}/offer-letters`, offerLetterRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/leaves`, leaveRoutes);
  app.use(`${prefix}/leave-balances`, leaveRoutes);
  app.use(`${prefix}/payroll`, payrollRoutes);
  app.use(`${prefix}/payslips`, payrollRoutes);
  app.use(`${prefix}/calendar`, calendarRoutes);
  app.use(`${prefix}/holidays`, holidayRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/audit-logs`, auditRoutes);
  app.use(`${prefix}/settings`, settingsRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Error Handler
app.use(errorHandler);

export default app;
