import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { GOVERNANCE_LEVELS, RECORD_STATUS } from './constants.js';

const sequelize = getDatabaseConnection();

export const InstitutionModel = sequelize.define(
  'Institution',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    institutionId: {
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    institutionType: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Government Office',
    },
    level: {
      type: DataTypes.ENUM(...GOVERNANCE_LEVELS),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...RECORD_STATUS),
      allowNull: false,
      defaultValue: 'active',
    },
    officialEmail: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    officialPhone: {
      type: DataTypes.STRING(24),
      allowNull: true,
    },
    officeAddress: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
      allowNull: true,
    },
    districtId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sector: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    sectorId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    cell: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    cellId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    village: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    villageId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    leaderNationalId: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    createdByInviteId: {
      type: DataTypes.STRING(24),
      allowNull: true,
    },
    qrCodeDataUrl: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'institutions',
    indexes: [
      {
        fields: ['level'],
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
