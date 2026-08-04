import mysql from "mysql2/promise";
import { config } from "../config/index.js";

export const connection = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
  namedPlaceholders: false,
});

export async function withTransaction(callback) {
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export async function assertDatabaseConnection() {
  await connection.query("SELECT 1");
}
