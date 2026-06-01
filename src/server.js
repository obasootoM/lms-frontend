require('dotenv').config();
require('express-async-errors');

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const connectDB   = require('./config/db');
const authRoutes  = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const {
  materialRouter, assignmentRouter, pubRouter,
  annRouter, notifRouter, aiRouter, analyticsRouter
} = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Security & logging middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many login attempts, please wait 15 minutes' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/materials',     materialRouter);
app.use('/api/assignments',   assignmentRouter);
app.use('/api/publications',  pubRouter);
app.use('/api/announcements', annRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/ai-tutor',      aiRouter);
app.use('/api/analytics',     analyticsRouter);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// server.js - Add memory monitoring
app.use((req, res, next) => {
  const used = process.memoryUsage();
  console.log({
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    }
  });
  next();
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LMS API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;

#lms-backend-gamma-opal.vercel.app



