const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

/**
 * Custom application error with HTTP status support.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express app (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    const errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
    logger.warn(`Sequelize Validation Error: ${err.message}`, { path: req.path });
    return sendError(res, { statusCode, message: 'Validation failed', errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${message}`, {
      statusCode,
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} — ${message}`, { statusCode });
  }

  // Don't leak internal error details in production
  const responseMessage =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : message || 'Something went wrong';

  return sendError(res, { statusCode, message: responseMessage });
};

module.exports = { errorHandler, AppError };
