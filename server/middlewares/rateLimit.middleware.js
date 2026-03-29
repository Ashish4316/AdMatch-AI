const { getRedisClient } = require('../config/redis');
const { sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Redis-based sliding-window rate limiter.
 *
 * @param {object} options
 * @param {number} options.maxAttempts   - Max requests allowed in the window (default 5)
 * @param {number} options.windowSeconds - Window size in seconds (default 900 = 15 min)
 * @param {string} options.keyPrefix     - Redis key prefix (default 'rl')
 * @param {string} options.message       - Error message on limit exceeded
 * @param {(req) => string} options.keyFn - Custom function to derive the rate-limit key from req
 */
const createRedisRateLimiter = ({
  maxAttempts = 5,
  windowSeconds = 900,
  keyPrefix = 'rl',
  message = 'Too many attempts. Please try again later.',
  keyFn = null,
} = {}) => {
  return async (req, res, next) => {
    let redis;
    try {
      redis = getRedisClient();
    } catch {
      // If Redis is unavailable, skip rate limiting rather than blocking all requests
      logger.warn('Redis unavailable – skipping rate limit check');
      return next();
    }

    const identifier = keyFn
      ? keyFn(req)
      : req.ip || req.headers['x-forwarded-for'];

    const key = `${keyPrefix}:${identifier}`;

    try {
      const attempts = await redis.incr(key);

      if (attempts === 1) {
        // First attempt in this window — set expiry
        await redis.expire(key, windowSeconds);
      }

      if (attempts > maxAttempts) {
        const ttl = await redis.ttl(key);
        logger.warn(`Rate limit exceeded for key "${key}". Attempt #${attempts}. TTL: ${ttl}s`);
        return res.status(429).json({
          success: false,
          message,
          retryAfter: ttl,
          timestamp: new Date().toISOString(),
        });
      }

      // Attach remaining attempts to request for optional downstream use
      req.rateLimitRemaining = maxAttempts - attempts;
      next();
    } catch (err) {
      logger.error(`Rate limiter Redis error: ${err.message}`);
      next(); // fail open
    }
  };
};

/**
 * Preconfigured login rate limiter:
 * 5 attempts per 15 minutes, keyed by IP + email body.
 */
const loginRateLimiter = createRedisRateLimiter({
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  keyPrefix: 'rl:login',
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyFn: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const email = (req.body?.email || '').toLowerCase();
    return `${ip}:${email}`;
  },
});

module.exports = { createRedisRateLimiter, loginRateLimiter };
