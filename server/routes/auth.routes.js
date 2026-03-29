const express = require('express');
const router = express.Router();

const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { protect, verifyRefreshToken } = require('../middlewares/auth.middleware');
const { loginRateLimiter } = require('../middlewares/rateLimit.middleware');
const { registerValidation, loginValidation } = require('../middlewares/validate.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
router.post('/register', registerValidation, register);

// POST /api/v1/auth/login  ← Redis rate limited (5 attempts / 15 min per IP+email)
router.post('/login', loginRateLimiter, loginValidation, login);

// POST /api/v1/auth/refresh  ← Requires valid httpOnly refresh cookie
router.post('/refresh', verifyRefreshToken, refresh);

// ── Protected Routes ──────────────────────────────────────────────────────
// POST /api/v1/auth/logout
router.post('/logout', protect, logout);

// GET /api/v1/auth/me
router.get('/me', protect, getMe);

module.exports = router;
