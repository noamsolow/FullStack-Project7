import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { assertDatabaseConnection, connection } from "./db/connection.js";
import { startDeliveryTrackingTimer } from "./services/deliveryTrackingService.js";

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
const deliveryTrackingTimer = startDeliveryTrackingTimer();

async function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", message: `Received ${signal}` }));
  clearInterval(deliveryTrackingTimer);
  server.close(async () => {
    await connection.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
