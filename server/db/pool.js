import mysql from "mysql2/promise";
import { config } from "../config/index.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  connectionLimit: config.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
  namedPlaceholders: false,
});

export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function assertDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
}

