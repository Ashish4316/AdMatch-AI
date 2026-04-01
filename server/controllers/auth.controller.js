const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { addTokenToBlacklist } = require('../middlewares/auth.middleware');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
} = require('../utils/apiResponse');
const logger = require('../utils/logger');

const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_REFRESH_COOKIE_MAX_AGE_MS = Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: JWT_REFRESH_COOKIE_MAX_AGE_MS,
};

const REFRESH_CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const formatCompany = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  industry: row.industry,
  createdAt: row.created_at,
});

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

const register = async (req, res, next) => {
  try {
    const { name, email, password, industry } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await query('SELECT id FROM companies WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return sendError(res, {
        statusCode: 409,
        message: 'A company with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const insertResult = await query(
      `INSERT INTO companies (name, email, password, industry)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, industry, created_at`,
      [name.trim(), normalizedEmail, hashedPassword, industry.trim()]
    );

    const company = insertResult.rows[0];
    const accessToken = generateAccessToken(company.id);
    const refreshToken = generateRefreshToken(company.id);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    logger.info(`Company registered: ${company.email}`);

    return sendCreated(res, {
      message: 'Company registered successfully.',
      data: {
        company: formatCompany(company),
        accessToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await query(
      'SELECT id, name, email, password, industry, created_at FROM companies WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    const company = result.rows[0];
    if (!company) {
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    const validPassword = await bcrypt.compare(password, company.password);
    if (!validPassword) {
      logger.warn(`Failed login for: ${normalizedEmail}`);
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    const accessToken = generateAccessToken(company.id);
    const refreshToken = generateRefreshToken(company.id);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return sendSuccess(res, {
      message: 'Login successful.',
      data: {
        company: formatCompany(company),
        accessToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(req.company.id);
    return sendSuccess(res, {
      message: 'Access token refreshed successfully.',
      data: { accessToken },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.token) {
      addTokenToBlacklist(req.token);
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      addTokenToBlacklist(refreshToken);
    }

    res.clearCookie('refreshToken', REFRESH_CLEAR_COOKIE_OPTIONS);

    return sendSuccess(res, {
      message: 'Logout successful.',
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, {
    message: 'Company profile fetched successfully.',
    data: {
      company: req.company,
    },
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
