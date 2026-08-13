# NEUZEN AI HRMS — Backend API Service

Standalone Node.js + Express.js + Mongoose (MongoDB) REST API server for the NEUZEN AI Human Resource Management System.

---

## Technical Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication & Security**: JSON Web Tokens (JWT), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- **Document Services**: Server-side PDF generation (`pdfkit`), CSV exporter
- **Logging**: Morgan

---

## Directory Architecture

```
backend/
├── src/
│   ├── config/          # Database & environment setup
│   ├── controllers/     # API request handlers (Auth, Employees, Attendance, Leaves, Payroll, etc.)
│   ├── middleware/      # Auth, RBAC, error handling, rate limiting
│   ├── models/          # Mongoose schemas & data models
│   ├── routes/          # Express routing declarations
│   ├── seeds/           # Database seeder script
│   ├── services/        # PDF & CSV generation services
│   ├── app.js           # Express app setup & middleware pipeline
│   └── server.js        # Entry point & listener
├── tests/               # Backend API integration tests
├── Dockerfile           # Production container configuration
├── .env.example         # Environment template
└── package.json         # Backend dependencies and scripts
```

---

## Quick Start (Standalone Backend Execution)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB server running locally (`mongodb://127.0.0.1:27017/neuzen_hrms`) or Atlas connection string

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/neuzen_hrms
JWT_SECRET=neuzen_ai_hrms_super_secret_jwt_key_2026
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database
Populate demo users (`admin@neuzen.ai`, `hr@neuzen.ai`, `employee@neuzen.ai`), employee directory, historical attendance records, leave balances, payrolls, calendar events, and audit logs:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

The REST API will be available at **http://localhost:5000**.

---

## Scripts Overview

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start development server with live reload (`nodemon`) |
| `npm run start` | Start production Node.js server |
| `npm run seed` | Seed database with initial demo data |
| `npm test` | Run automated test suite |

---

## Primary API Endpoints

- `POST /api/auth/login` — User authentication & JWT generation
- `GET /api/employees` — Employee directory with search, filter, pagination
- `POST /api/attendance/check-in` & `/check-out` — Time & attendance tracking
- `POST /api/leaves` & `PATCH /api/leaves/:id/approve` — Leave management workflow
- `POST /api/payroll/process` — Monthly payroll engine
- `GET /api/payroll/:id/pdf` — Dynamic PDF payslip stream
- `GET /api/offer-letters/:id/pdf` — Dynamic PDF offer letter stream
- `GET /api/audit-logs` — Administrative audit trail
- `GET /api/health` — System health check
