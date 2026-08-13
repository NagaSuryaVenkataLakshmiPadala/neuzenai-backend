import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Vercel Serverless Handler (used when deployed to Vercel)
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Server Initialization Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Local Development Server (used when running with nodemon/node)
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Server] Running locally on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[Server] Failed to start:', err.message);
      process.exit(1);
    });
}
