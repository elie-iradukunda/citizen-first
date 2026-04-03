import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { COMPLAINT_STATUS } from './constants.js';

const sequelize = getDatabaseConnection();

export const ComplaintResponseModel = sequelize.define(
  'ComplaintResponse',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    responseId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    complaintId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      references: {
        model: 'complaints',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    responderUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    responderEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institution_employees',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM('citizen', 'internal'),
      allowNull: false,
      defaultValue: 'citizen',
    },
    statusAfterResponse: {
      type: DataTypes.ENUM(...COMPLAINT_STATUS),
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'complaint_responses',
    indexes: [
      {
        fields: ['complaintId'],
      },
      {
        fields: ['responderUserId'],
      },
      {
        fields: ['respondedAt'],
      },
    ],
  },
);
