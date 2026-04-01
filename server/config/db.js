const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Supabase Connection String Pattern
// postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  dialectOptions: {
    // Supabase requires SSL connection
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

/**
 * Test and authenticate the database connection.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully via Sequelize.');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
