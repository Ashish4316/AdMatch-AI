const logger = require('../utils/logger');
const { error: errorResponse } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = Number(err.statusCode) || 500;
  const message = err.message || 'Something went wrong';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${message}`);
  }

  return errorResponse(
    res,
    statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    statusCode
  );
};

module.exports = {
  AppError,
  notFoundHandler,
  errorMiddleware,
};
