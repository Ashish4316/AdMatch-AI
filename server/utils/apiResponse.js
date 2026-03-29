/**
 * Standard API Response Utility
 * Provides consistent response shapes across all endpoints.
 */

/**
 * Success response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

/**
 * Created response (201).
 */
const sendCreated = (res, { message = 'Created successfully', data = null } = {}) => {
  return sendSuccess(res, { statusCode: 201, message, data });
};

/**
 * Error response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const payload = {
    success: false,
    message,
    ...(errors !== null && { errors }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

/**
 * Paginated success response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendPaginated = (res, { message = 'Success', data = [], page = 1, limit = 10, total = 0 } = {}) => {
  const meta = {
    page: Number(page),
    limit: Number(limit),
    total: Number(total),
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
  return sendSuccess(res, { message, data, meta });
};

/**
 * 404 Not Found response.
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, { statusCode: 404, message });
};

/**
 * 400 Bad Request response.
 */
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, { statusCode: 400, message, errors });
};

/**
 * 401 Unauthorized response.
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, { statusCode: 401, message });
};

/**
 * 403 Forbidden response.
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, { statusCode: 403, message });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendPaginated,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
};
