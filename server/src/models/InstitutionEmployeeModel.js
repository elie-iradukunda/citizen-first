import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { EMPLOYEE_STATUS } from './constants.js';

const sequelize = getDatabaseConnection();

export const InstitutionEmployeeModel = sequelize.define(
  'InstitutionEmployee',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
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
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institution_departments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    leaderCode: {
      type: DataTypes.STRING(40),
      allowNull: true,
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
    phone: {
      type: DataTypes.STRING(24),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    positionTitle: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    positionKinyarwanda: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    reportsTo: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...EMPLOYEE_STATUS),
      allowNull: false,
      defaultValue: 'Active',
    },
    isLeader: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'institution_employees',
    indexes: [
      {
        fields: ['institutionId'],
      },
      {
        fields: ['departmentId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['isLeader'],
      },
    ],
  },
);
