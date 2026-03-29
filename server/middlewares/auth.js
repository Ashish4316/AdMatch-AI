// TODO: Implement JWT authentication middleware
// Example skeleton:
//
// const jwt = require('jsonwebtoken');
// const { sendUnauthorized } = require('../utils/apiResponse');
//
// const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return sendUnauthorized(res);
//   try {
//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     sendUnauthorized(res, 'Invalid or expired token');
//   }
// };
//
// module.exports = { protect };
