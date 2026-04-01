const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { sendUnauthorized } = require('../utils/apiResponse');

const tokenBlacklist = [];

const pruneBlacklist = () => {
  const now = Date.now();
  for (let index = tokenBlacklist.length - 1; index >= 0; index -= 1) {
    if (tokenBlacklist[index].expiresAt <= now) {
      tokenBlacklist.splice(index, 1);
    }
  }
};

const addTokenToBlacklist = (token, expiresAt) => {
  if (!token) {
    return;
  }
  pruneBlacklist();

  const decoded = jwt.decode(token);
  const fallback = Date.now() + 15 * 60 * 1000;
  const tokenExpiry =
    typeof expiresAt === 'number'
      ? expiresAt
      : decoded?.exp
        ? decoded.exp * 1000
        : fallback;

  tokenBlacklist.push({ token, expiresAt: tokenExpiry });
};

const isTokenBlacklisted = (token) => {
  pruneBlacklist();
  return tokenBlacklist.some((entry) => entry.token === token);
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const fetchCompanyById = async (companyId) => {
  const { rows } = await query(
    'SELECT id, name, email, industry, created_at FROM companies WHERE id = $1 LIMIT 1',
    [companyId]
  );
  return rows[0] || null;
};

const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return sendUnauthorized(res, 'Access token is missing.');
    }

    if (isTokenBlacklisted(token)) {
      return sendUnauthorized(res, 'Token has been revoked. Please login again.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return sendUnauthorized(res, 'Invalid or expired access token.');
    }

    const company = await fetchCompanyById(decoded.id);
    if (!company) {
      return sendUnauthorized(res, 'Company account not found.');
    }

    req.token = token;
    req.company = company;
    return next();
  } catch (error) {
    return sendUnauthorized(res, 'Authentication failed.');
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return sendUnauthorized(res, 'Refresh token is missing.');
    }

    if (isTokenBlacklisted(refreshToken)) {
      return sendUnauthorized(res, 'Refresh token has been revoked. Please login again.');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return sendUnauthorized(res, 'Invalid or expired refresh token.');
    }

    const company = await fetchCompanyById(decoded.id);
    if (!company) {
      return sendUnauthorized(res, 'Company account not found.');
    }

    req.refreshToken = refreshToken;
    req.company = company;
    return next();
  } catch (error) {
    return sendUnauthorized(res, 'Refresh token verification failed.');
  }
};

module.exports = {
  protect,
  verifyRefreshToken,
  addTokenToBlacklist,
};
