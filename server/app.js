import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { assertDatabaseConnection } from "./db/connection.js";
import { requestContext } from "./middleware/requestContext.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { catalogRouter } from "./routes/catalogRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { printRouter } from "./routes/printRoutes.js";
import { maintenanceRouter } from "./routes/maintenanceRoutes.js";
import { recommendationRouter } from "./routes/recommendationRoutes.js";
import { partnerRouter } from "./routes/partnerRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { mediaRouter } from "./routes/mediaRoutes.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export function createApp() {
  const app = express();
  if (config.isProduction) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(requestLogger);
  app.use(cors({
    origin: config.clientOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  }));
  app.use(express.json({ limit: "200kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      data: {
        service: "levgo-api",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  });
  app.get("/api/health/ready", asyncHandler(async (_request, response) => {
    await assertDatabaseConnection();
    response.json({ data: { database: "ready" } });
  }));

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/print-jobs", printRouter);
  app.use("/api/maintenance-tickets", maintenanceRouter);
  app.use("/api/recommendations", recommendationRouter);
  app.use("/api/partner", partnerRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/media", mediaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

