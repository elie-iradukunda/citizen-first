import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';

const sequelize = getDatabaseConnection();

export const InstitutionQrCodeModel = sequelize.define(
  'InstitutionQrCode',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    qrCodeId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    targetUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    imageDataUrl: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'institution_qr_codes',
    indexes: [
      {
        fields: ['institutionId'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
  },
);
