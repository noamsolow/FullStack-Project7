import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { assertDatabaseConnection, pool } from "./db/pool.js";
import { startCleanupTimer } from "./services/cleanupService.js";

await assertDatabaseConnection();
const app = createApp();
const server = app.listen(config.port, () => {
  console.log(JSON.stringify({
    level: "info",
    message: "LevGo API listening",
    port: config.port,
    environment: config.nodeEnv,
  }));
});
const cleanupTimer = startCleanupTimer();

async function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", message: `Received ${signal}` }));
  clearInterval(cleanupTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
