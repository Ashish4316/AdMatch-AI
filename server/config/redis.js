const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const createRedisClient = () => {
  const options = process.env.REDIS_URL
    ? { lazyConnect: true }
    : {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          logger.warn(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
          return delay;
        },
      };

  const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, options)
    : new Redis(options);

  client.on('connect', () => logger.info('Redis client connected.'));
  client.on('ready', () => logger.info('Redis client ready to use.'));
  client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  client.on('close', () => logger.warn('Redis connection closed.'));

  return client;
};

const connectRedis = async () => {
  try {
    redisClient = createRedisClient();
    await redisClient.connect();
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    // Non-fatal: app can run without cache
  }
};

const getRedisClient = () => {
  if (!redisClient) throw new Error('Redis client not initialized. Call connectRedis() first.');
  return redisClient;
};

/**
 * Helper: set a JSON value with optional TTL (seconds).
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
  const client = getRedisClient();
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

/**
 * Helper: get and parse a cached JSON value.
 */
const getCache = async (key) => {
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Helper: delete a cache key.
 */
const deleteCache = async (key) => {
  const client = getRedisClient();
  await client.del(key);
};

module.exports = { connectRedis, getRedisClient, setCache, getCache, deleteCache };
