import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { CITIZEN_ID_TYPES, GENDER_OPTIONS, RECORD_STATUS } from './constants.js';

const sequelize = getDatabaseConnection();

export const CitizenModel = sequelize.define(
  'Citizen',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    citizenId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    fullName: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    nationalId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM(...GENDER_OPTIONS),
      allowNull: false,
    },
    idType: {
      type: DataTypes.ENUM(...CITIZEN_ID_TYPES),
      allowNull: false,
      defaultValue: 'NATIONAL_ID',
    },
    status: {
      type: DataTypes.ENUM(...RECORD_STATUS),
      allowNull: false,
      defaultValue: 'active',
    },
    country: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Rwanda',
    },
    province: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    provinceId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    districtId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sector: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    sectorId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    cell: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    cellId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    village: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    villageId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'citizens',
    indexes: [
      {
        fields: ['userId'],
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
