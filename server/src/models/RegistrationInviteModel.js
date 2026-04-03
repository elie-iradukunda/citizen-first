import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { GOVERNANCE_LEVELS } from './constants.js';

const sequelize = getDatabaseConnection();

const HIERARCHY_LEVELS = GOVERNANCE_LEVELS.filter((level) => level !== 'national');

export const RegistrationInviteModel = sequelize.define(
  'RegistrationInvite',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inviteId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    token: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    usedByInstitutionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    targetLevel: {
      type: DataTypes.ENUM(...HIERARCHY_LEVELS),
      allowNull: false,
    },
    institutionNameHint: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(24),
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
    status: {
      type: DataTypes.ENUM('pending', 'used', 'revoked', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    registrationLink: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qrCodeDataUrl: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'registration_invites',
    indexes: [
      {
        fields: ['createdByUserId'],
      },
      {
        fields: ['usedByInstitutionId'],
      },
      {
        fields: ['targetLevel', 'status'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
  },
);
