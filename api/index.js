import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  // CORS Preflight & Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Normalize Vercel Serverless Request URL for Express Routing
  const requestUrl = req.url || '/';
  if (!requestUrl.startsWith('/api')) {
    req.url = `/api${requestUrl.startsWith('/') ? '' : '/'}${requestUrl}`;
  }

  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Initialization Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed.',
      error: error.message,
    });
  }
}
