import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

let sequelize;
let isInitialized = false;

function readDatabaseConfig() {
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
  await connection.sync(readSyncConfig());

  isInitialized = true;
  return connection;
}
