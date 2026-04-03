import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import {
  COMPLAINT_REPORTING_MODES,
  COMPLAINT_STATUS,
  GOVERNANCE_LEVELS,
} from './constants.js';

const sequelize = getDatabaseConnection();

export const ComplaintModel = sequelize.define(
  'Complaint',
  {
    id: {
      type: DataTypes.STRING(32),
      primaryKey: true,
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    citizenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'citizens',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    citizenReference: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    reportingMode: {
      type: DataTypes.ENUM(...COMPLAINT_REPORTING_MODES),
      allowNull: false,
      defaultValue: 'anonymous',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sourceChannel: {
      type: DataTypes.ENUM('qr', 'web', 'mobile', 'hotline', 'assistant'),
      allowNull: false,
      defaultValue: 'web',
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'normal',
    },
    status: {
      type: DataTypes.ENUM(...COMPLAINT_STATUS),
      allowNull: false,
      defaultValue: 'submitted',
    },
    currentLevel: {
      type: DataTypes.ENUM(...GOVERNANCE_LEVELS),
      allowNull: false,
      defaultValue: 'cell',
    },
    assignedOfficerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institution_employees',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    assignedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    deadlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isVoiceReport: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    evidenceSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    locationCountry: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    locationProvince: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    locationDistrict: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    locationSector: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    locationCell: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    locationVillage: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'complaints',
    indexes: [
      {
        fields: ['institutionId'],
      },
      {
        fields: ['citizenId'],
      },
      {
        fields: ['status', 'currentLevel'],
      },
      {
        fields: ['deadlineAt'],
      },
    ],
  },
);
