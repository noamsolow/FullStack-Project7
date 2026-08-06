import { connection } from "../db/connection.js";
import { DatabaseSchemaError } from "../db/errors.js";

export async function findTokenBalance(userId, executor = connection, lock = false) {
  try {
    const [rows] = await executor.query(
      `SELECT token_balance
       FROM users
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1
       ${lock ? "FOR UPDATE" : ""}`,
      [userId],
    );
    return rows[0] ? Number(rows[0].token_balance) : null;
  } catch (error) {
    if (error instanceof DatabaseSchemaError) return null;
    throw error;
  }
}

export async function debitTokens(
  { publicId, userId, orderId, amountTokens, note },
  executor,
) {
  const [result] = await executor.query(
    `UPDATE users
     SET token_balance = token_balance - ?
     WHERE id = ? AND deleted_at IS NULL AND token_balance >= ?`,
    [amountTokens, userId, amountTokens],
  );
  if (result.affectedRows !== 1) return null;

  const balanceAfterTokens = await findTokenBalance(userId, executor);
  await executor.query(
    `INSERT INTO token_transactions (
      public_id, user_id, order_id, amount_tokens, balance_after_tokens,
      transaction_type, note
    ) VALUES (?, ?, ?, ?, ?, 'order_payment', ?)`,
    [
      publicId,
      userId,
      orderId,
      -amountTokens,
      balanceAfterTokens,
      note,
    ],
  );
  return balanceAfterTokens;
}
