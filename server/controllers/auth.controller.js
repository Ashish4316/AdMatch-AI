const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Company = require('../models/Company.model');
const { getRedisClient } = require('../config/redis');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
} = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Token helpers ────────────────────────────────────────────────────────────

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register a new company account.
 */
const register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const { name, email, password, industry } = req.body;

    // Check duplicate email
    const existing = await Company.findOne({ where: { email } });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'An account with this email already exists.' });
    }

    // Create (password hashed by model hook)
    const company = await Company.create({ name, email, password, industry });

    const accessToken = generateAccessToken(company.id);
    const refreshToken = generateRefreshToken(company.id);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    logger.info(`New company registered: ${email}`);

    return sendCreated(res, {
      message: 'Company registered successfully.',
      data: {
        company: company.toPublicJSON(),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticate a company and return tokens.
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;

    // Find company (include password for comparison)
    const company = await Company.findOne({ where: { email } });
    if (!company) {
      // Generic message to prevent email enumeration
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    if (!company.isActive) {
      return sendUnauthorized(res, 'Your account has been deactivated. Contact support.');
    }

    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for ${email}`);
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    const accessToken = generateAccessToken(company.id);
    const refreshToken = generateRefreshToken(company.id);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    logger.info(`Company login: ${email}`);

    return sendSuccess(res, {
      message: 'Login successful.',
      data: {
        company: company.toPublicJSON(),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Issue a new access token using the httpOnly refresh token cookie.
 * (Gated by verifyRefreshToken middleware which sets req.company)
 */
const refresh = async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(req.company.id);

    logger.info(`Access token refreshed for company: ${req.company.email}`);

    return sendSuccess(res, {
      message: 'Access token refreshed.',
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Blacklist both the access token and the refresh cookie in Redis.
 * (Gated by protect middleware which sets req.company and req.token)
 */
const logout = async (req, res, next) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch {
      logger.warn('Redis unavailable during logout – tokens not blacklisted');
    }

    if (redis) {
      // Blacklist access token until it naturally expires (15 min)
      await redis.set(`blacklist:${req.token}`, '1', 'EX', 15 * 60);

      // Blacklist refresh token for 7 days
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await redis.set(`blacklist:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info(`Company logged out: ${req.company.email}`);

    return sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Return the authenticated company's profile.
 * (Gated by protect middleware)
 */
const getMe = async (req, res) => {
  return sendSuccess(res, {
    message: 'Profile fetched successfully.',
    data: { company: req.company.toPublicJSON() },
  });
};

module.exports = { register, login, refresh, logout, getMe };
