import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';

const sequelize = getDatabaseConnection();

export const VoiceRecordModel = sequelize.define(
  'VoiceRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    voiceRecordId: {
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
    storageProvider: {
      type: DataTypes.ENUM('local', 'cloud', 'external'),
      allowNull: false,
      defaultValue: 'local',
    },
    audioUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    audioFormat: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transcript: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'rw',
    },
    processingStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'voice_records',
    indexes: [
      {
        fields: ['complaintId'],
      },
      {
        fields: ['processingStatus'],
      },
    ],
  },
);
