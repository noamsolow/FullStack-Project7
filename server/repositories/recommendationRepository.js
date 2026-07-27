import { pool } from "../db/pool.js";

export async function recordRecommendation(data, executor = pool) {
  await executor.query(
    `INSERT INTO recommendation_requests (
      public_id, user_id, need_type, budget_agorot,
      provider_used, outcome, result_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.userId,
      data.needType,
      data.budgetAgorot,
      data.providerUsed,
      data.outcome,
      data.resultCount,
    ],
  );
}

