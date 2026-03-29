const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const Company = sequelize.define(
  'Company',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Company name is required' },
        len: { args: [2, 150], msg: 'Name must be between 2 and 150 characters' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'A company with this email already exists' },
      validate: {
        isEmail: { msg: 'Please provide a valid email address' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Industry is required' },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'companies',
    hooks: {
      beforeCreate: async (company) => {
        if (company.password) {
          company.password = await bcrypt.hash(company.password, 12);
        }
      },
      beforeUpdate: async (company) => {
        if (company.changed('password')) {
          company.password = await bcrypt.hash(company.password, 12);
        }
      },
    },
  }
);

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
Company.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a safe public representation (no password).
 */
Company.prototype.toPublicJSON = function () {
  const { password, ...safe } = this.toJSON();
  return safe;
};

module.exports = Company;
