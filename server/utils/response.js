const success = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null ? { data } : { data: null }),
  });
};

const error = (res, message = 'Internal Server Error', statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data !== null ? { data } : { data: null }),
  });
};

module.exports = {
  success,
  error,
};
