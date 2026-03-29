const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const { sendUnauthorized, sendForbidden } = require('../utils/apiResponse');
const Company = require('../models/Company.model');
const logger = require('../utils/logger');

/**
 * Verify access token and attach company to req.company.
 * Rejects if the token is blacklisted in Redis (logged-out sessions).
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendUnauthorized(res, 'Access token expired. Please refresh.');
      }
      return sendUnauthorized(res, 'Invalid access token.');
    }

    // 3. Check Redis blacklist (logout / token revocation)
    let redis;
    try {
      redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return sendUnauthorized(res, 'Token has been revoked. Please log in again.');
      }
    } catch {
      logger.warn('Redis check skipped in protect middleware (unavailable)');
    }

    // 4. Load company from DB
    const company = await Company.findByPk(decoded.id);
    if (!company) {
      return sendUnauthorized(res, 'Account not found.');
    }
    if (!company.isActive) {
      return sendForbidden(res, 'Your account has been deactivated.');
    }

    // 5. Attach to request
    req.company = company;
    req.token = token;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    return sendUnauthorized(res, 'Authentication failed.');
  }
};

/**
 * Verify refresh token from httpOnly cookie.
 * Used exclusively by POST /api/v1/auth/refresh.
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return sendUnauthorized(res, 'No refresh token. Please log in.');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return sendUnauthorized(res, 'Invalid or expired refresh token. Please log in.');
    }

    // Check Redis blacklist for refresh token
    let redis;
    try {
      redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return sendUnauthorized(res, 'Refresh token revoked. Please log in.');
      }
    } catch {
      logger.warn('Redis check skipped in verifyRefreshToken (unavailable)');
    }

    const company = await Company.findByPk(decoded.id);
    if (!company || !company.isActive) {
      return sendUnauthorized(res, 'Account not found or deactivated.');
    }

    req.company = company;
    req.refreshToken = refreshToken;
    next();
  } catch (err) {
    logger.error(`verifyRefreshToken error: ${err.message}`);
    return sendUnauthorized(res, 'Token verification failed.');
  }
};

module.exports = { protect, verifyRefreshToken };
