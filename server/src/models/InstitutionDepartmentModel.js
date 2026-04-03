import { DataTypes } from 'sequelize';
import { getDatabaseConnection } from '../config/database.js';
import { RECORD_STATUS } from './constants.js';

const sequelize = getDatabaseConnection();

export const InstitutionDepartmentModel = sequelize.define(
  'InstitutionDepartment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentId: {
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
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(400),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...RECORD_STATUS),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'institution_departments',
    indexes: [
      {
        fields: ['institutionId'],
      },
      {
        fields: ['status'],
      },
    ],
  },
);
