import {
  listExpiredPrintFiles,
  markPrintFileDeleted,
} from "../models/printModel.js";
import { expireReservations } from "./orderService.js";

export async function runCleanup() {
  const expiredOrders = await expireReservations();
  const files = await listExpiredPrintFiles();
  let deletedFiles = 0;
  for (const file of files) {
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
