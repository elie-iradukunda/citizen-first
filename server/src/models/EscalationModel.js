import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { GOVERNANCE_LEVELS } from './constants.js';

const sequelize = getDatabaseConnection();

export const EscalationModel = sequelize.define(
  'Escalation',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    escalationId: {
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
    fromLevel: {
      type: DataTypes.ENUM(...GOVERNANCE_LEVELS),
      allowNull: false,
    },
    toLevel: {
      type: DataTypes.ENUM(...GOVERNANCE_LEVELS),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    triggerType: {
      type: DataTypes.ENUM('automatic', 'manual'),
      allowNull: false,
      defaultValue: 'automatic',
    },
    escalatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    escalatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'complaint_escalations',
    indexes: [
      {
        fields: ['complaintId'],
      },
      {
        fields: ['fromLevel', 'toLevel'],
      },
      {
        fields: ['escalatedAt'],
      },
    ],
  },
);
