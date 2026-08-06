import mysql from "mysql2/promise";
import { config } from "../config/index.js";
import { normalizeDatabaseError } from "./errors.js";

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
  namedPlaceholders: false,
  waitForConnections: true,
  connectionLimit: 10,
});

async function query(executor, ...args) {
  try {
    return await executor.query(...args);
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

function queryExecutor(executor) {
  return Object.freeze({
    query: (...args) => query(executor, ...args),
  });
}

export const connection = Object.freeze({
  query: (...args) => query(pool, ...args),
  end: () => pool.end(),
});

export async function withTransaction(callback) {
  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();
    const result = await callback(queryExecutor(transaction));
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.release();
  }
}

export async function assertDatabaseConnection() {
  await connection.query("SELECT 1");
}
