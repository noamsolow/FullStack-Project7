import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/index.js";
import {
  listExpiredPrintFiles,
  markPrintFileDeleted,
} from "../repositories/printRepository.js";
import { expireReservations } from "./orderService.js";

export async function runCleanup() {
  const expiredOrders = await expireReservations();
  const files = await listExpiredPrintFiles();
  let deletedFiles = 0;
  for (const file of files) {
    const target = path.join(config.storage.printFiles, file.storage_name);
    await fs.unlink(target).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await markPrintFileDeleted(file.id);
    deletedFiles += 1;
  }
  return { expiredOrders, deletedFiles };
}

export function startCleanupTimer() {
  const timer = setInterval(() => {
    runCleanup().catch((error) => {
      console.error(JSON.stringify({
        level: "error",
        message: "Background cleanup failed",
        errorName: error.name ?? "Error",
      }));
    });
  }, 60_000);
  timer.unref();
  return timer;
}
