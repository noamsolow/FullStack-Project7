
export function requestLogger(request, response, next) {
  const startedAt = process.hrtime.bigint();
  const path = request.originalUrl.split("?", 1)[0];

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.info(JSON.stringify({
      level: "info",
      requestId: request.id,
      method: request.method,
      path,
      status: response.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    }));
  });

  next();
}
