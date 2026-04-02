const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const { pool } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { startYoutubeSyncJob } = require('./jobs/youtube.sync.job');
const { errorMiddleware, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// ── Security & Parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP Logging ───────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AdMatch AI server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/influencers', require('./routes/influencer.routes'));
app.use('/api/v1/campaigns', require('./routes/campaign.routes'));
app.use('/api/v1/matches', require('./routes/match.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/shortlist', require('./routes/shortlist.routes'));
// app.use('/api/v1/brands', require('./routes/brand.routes'));

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorMiddleware);

// ── Bootstrap ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const startServer = async () => {
  // Verify PostgreSQL connection
  try {
    await pool.query('SELECT 1');
    logger.info('✅ PostgreSQL connected via pg pool');
  } catch (err) {
    logger.error(`❌ Database connection failed: ${err.message}`);
    process.exit(1);
  }

  await connectRedis();
  startYoutubeSyncJob();

  app.listen(PORT, () => {
    logger.info(`🚀 AdMatch AI server running on http://localhost:${PORT}`);
    logger.info(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
