import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

let sequelize;
let isInitialized = false;

function readDatabaseConfig() {
  const databaseUrl = process.env.MYSQL_URL ?? process.env.DATABASE_URL;

  if (databaseUrl?.startsWith('mysql://') || databaseUrl?.startsWith('mysql2://')) {
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 3306),
      name: parsedUrl.pathname.replace(/^\//, '') || 'railway',
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
    };
  }

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME ?? 'citizen_first',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  };
}

function readSyncConfig() {
  return {
    alter: process.env.DB_SYNC_ALTER === 'true',
    force: process.env.DB_SYNC_FORCE === 'true',
  };
}

function getModelTableName(model) {
  const tableName = model.getTableName();
  return typeof tableName === 'string' ? tableName : tableName.tableName;
}

function buildCompatibleColumnDefinition(attribute) {
  const definition = {
    type: attribute.type,
    allowNull: true,
  };

  if (attribute.defaultValue !== undefined) {
    definition.defaultValue = attribute.defaultValue;
  }

  return definition;
}

async function ensureExistingTableColumns(connection) {
  const queryInterface = connection.getQueryInterface();

  for (const model of Object.values(connection.models)) {
    const tableName = getModelTableName(model);
    let existingColumns;

    try {
      existingColumns = await queryInterface.describeTable(tableName);
    } catch (error) {
      const errorMessage = String(error?.message ?? '');
      if (
        error?.original?.code === 'ER_NO_SUCH_TABLE' ||
        error?.parent?.code === 'ER_NO_SUCH_TABLE' ||
        errorMessage.includes('No description found')
      ) {
        continue;
      }

      throw error;
    }

    for (const attribute of Object.values(model.rawAttributes)) {
      const columnName = attribute.field || attribute.fieldName;

      if (!columnName || existingColumns[columnName] || attribute.primaryKey) {
        continue;
      }

      await queryInterface.addColumn(
        tableName,
        columnName,
        buildCompatibleColumnDefinition(attribute),
      );
    }
  }
}

async function ensureDatabaseExists() {
  const databaseConfig = readDatabaseConfig();

  const connection = await mysql.createConnection({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseConfig.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
}

function shouldAutoCreateDatabase() {
  return process.env.DB_AUTO_CREATE_DATABASE !== 'false';
}

export function getDatabaseConnection() {
  if (!sequelize) {
    const databaseConfig = readDatabaseConfig();

    sequelize = new Sequelize(databaseConfig.name, databaseConfig.user, databaseConfig.password, {
      host: databaseConfig.host,
      port: databaseConfig.port,
      dialect: 'mysql',
      logging: false,
    });
  }

  return sequelize;
}

export async function initializeDatabase() {
  if (isInitialized) {
    return getDatabaseConnection();
  }

  if (shouldAutoCreateDatabase()) {
    await ensureDatabaseExists();
  }

  await import('../models/index.js');

  const connection = getDatabaseConnection();
  await connection.authenticate();
  await ensureExistingTableColumns(connection);
  await connection.sync(readSyncConfig());

  isInitialized = true;
  return connection;
}
