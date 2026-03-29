const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom console format
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

// File format (JSON for easy parsing)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

const transports = [
  // Console — always active
  new winston.transports.Console({
    format: consoleFormat,
    silent: process.env.NODE_ENV === 'test',
  }),

  // Combined log (all levels)
  new DailyRotateFile({
    dirname: path.join(process.cwd(), LOG_DIR),
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),

  // Error-only log
  new DailyRotateFile({
    dirname: path.join(process.cwd(), LOG_DIR),
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: fileFormat,
  }),
];

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  exitOnError: false,
});

// Expose a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
