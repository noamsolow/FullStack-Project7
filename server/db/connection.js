import mysql from "mysql2/promise";
import { config } from "../config/index.js";

export const connection = mysql.createPool({
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

export async function withTransaction(callback) {
  const transaction = await connection.getConnection();
  try {
    await transaction.beginTransaction();
    const result = await callback(transaction);
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
