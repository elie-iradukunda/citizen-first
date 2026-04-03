import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { RECORD_STATUS, USER_LEVELS, USER_ROLES } from './constants.js';

const sequelize = getDatabaseConnection();

export const UserModel = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    nationalId: {
      type: DataTypes.STRING(16),
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(24),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM(...USER_LEVELS),
      allowNull: false,
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    accessKey: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...RECORD_STATUS),
      allowNull: false,
      defaultValue: 'active',
    },
    country: {
      type: DataTypes.STRING(80),
      allowNull: true,
      defaultValue: 'Rwanda',
    },
    province: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    sector: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    cell: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    village: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    indexes: [
      {
        fields: ['role'],
      },
      {
        fields: ['institutionId'],
      },
      {
        fields: ['province', 'district', 'sector', 'cell', 'village'],
      },
      {
        fields: ['status'],
      },
    ],
  },
);
