import { pool } from "../db/pool.js";

export async function createPrintJob(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO print_jobs (
      public_id, job_number, user_id, vendor_id, paper_size, color_mode,
      sides, copies, stapled, laminated, spiral_bound, customer_note,
      quote_agorot, status, pickup_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.jobNumber,
      data.userId,
      data.vendorId,
      data.paperSize,
      data.colorMode,
      data.sides,
      data.copies,
      data.stapled,
      data.laminated,
      data.spiralBound,
      data.customerNote ?? null,
      data.quoteAgorot,
      data.status,
      data.pickupCode,
    ],
  );
  return result.insertId;
}

export async function findPrintFileBufferByJobId(printJobId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT file_data
     FROM print_files
     WHERE print_job_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [printJobId],
  );
  return rows[0]?.file_data ?? null;
}

export async function insertPrintFile(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO print_files (
      public_id, print_job_id, original_name, mime_type,
      size_bytes, file_data, sha256
    ) VALUES (?, ?, ?, 'application/pdf', ?, ?, ?)`,
    [
      data.publicId,
      data.printJobId,
      data.originalName,
      data.sizeBytes,
      data.fileData,
      data.sha256,
    ],
  );
  return result.insertId;
}

export async function addPrintHistory(
  { printJobId, actorUserId = null, fromStatus = null, toStatus, note = null },
  executor = pool,
) {
  await executor.query(
    `INSERT INTO print_job_history (
      print_job_id, actor_user_id, from_status, to_status, note
    ) VALUES (?, ?, ?, ?, ?)`,
    [printJobId, actorUserId, fromStatus, toStatus, note],
  );
}

export async function findPrintJobByPublicId(publicId, executor = pool, lock = false) {
  const [rows] = await executor.query(
    `SELECT
      pj.*, u.public_id AS user_public_id, u.display_name AS customer_name,
      v.public_id AS vendor_public_id, v.name AS vendor_name, v.slug AS vendor_slug,
      b.short_name AS building_name, pf.public_id AS file_public_id,
      pf.original_name AS file_name, pf.size_bytes AS file_size_bytes
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     JOIN vendors v ON v.id = pj.vendor_id
     JOIN buildings b ON b.id = v.building_id
     JOIN print_files pf ON pf.print_job_id = pj.id AND pf.deleted_at IS NULL
     WHERE pj.public_id = ?
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function listCustomerPrintJobs(
  userId,
  { fetchLimit, offset, status },
  executor = pool,
) {
  const where = ["pj.user_id = ?"];
  const params = [userId];
  if (status) {
    where.push("pj.status = ?");
    params.push(status);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      pj.public_id, pj.job_number, pj.paper_size, pj.color_mode,
      pj.sides, pj.copies, pj.stapled, pj.laminated, pj.spiral_bound,
      pj.quote_agorot, pj.currency,
      pj.status, pj.pickup_code, pj.quote_expires_at,
      pj.created_at, pj.updated_at, v.name AS vendor_name
     FROM print_jobs pj
     JOIN vendors v ON v.id = pj.vendor_id
     WHERE ${where.join(" AND ")}
     ORDER BY pj.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listVendorPrintJobs(
  vendorId,
  { fetchLimit, offset, status },
  executor = pool,
) {
  const where = ["pj.vendor_id = ?"];
  const params = [vendorId];
  if (status) {
    where.push("pj.status = ?");
    params.push(status);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      pj.public_id, pj.job_number, pj.paper_size, pj.color_mode,
      pj.sides, pj.copies, pj.stapled, pj.laminated, pj.spiral_bound,
      pj.customer_note,
      pj.quote_agorot, pj.currency, pj.status, pj.pickup_code,
      pj.created_at, pj.updated_at, u.display_name AS customer_name,
      pf.public_id AS file_public_id, pf.original_name AS file_name,
      pf.size_bytes AS file_size_bytes
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     JOIN print_files pf ON pf.print_job_id = pj.id AND pf.deleted_at IS NULL
     WHERE ${where.join(" AND ")}
     ORDER BY pj.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listPrintHistory(printJobId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      h.from_status, h.to_status, h.note, h.created_at,
      u.display_name AS actor_name
     FROM print_job_history h
     LEFT JOIN users u ON u.id = h.actor_user_id
     WHERE h.print_job_id = ?
     ORDER BY h.created_at`,
    [printJobId],
  );
  return rows;
}

export async function quotePrintJob(
  printJobId,
  quoteAgorot,
  status = "quoted",
  executor = pool,
) {
  await executor.query(
    `UPDATE print_jobs
     SET quote_agorot = ?, quote_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR),
       status = ?
     WHERE id = ?`,
    [quoteAgorot, status, printJobId],
  );
}

export async function setPrintStatus(printJobId, status, executor = pool) {
  await executor.query(
    `UPDATE print_jobs SET
      status = ?,
      completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      cancelled_at = CASE WHEN ? IN ('cancelled', 'rejected') THEN CURRENT_TIMESTAMP ELSE cancelled_at END,
      retention_delete_at = CASE
        WHEN ? IN ('completed', 'cancelled', 'rejected')
        THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        ELSE retention_delete_at
      END
     WHERE id = ?`,
    [status, status, status, status, printJobId],
  );
}

export async function createPrintPayment(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO payments (
      public_id, print_job_id, amount_agorot, currency, status
    ) VALUES (?, ?, ?, 'ILS', 'created')`,
    [data.publicId, data.printJobId, data.amountAgorot],
  );
  return result.insertId;
}

export async function beginPrintCheckout(printJobId, executor) {
  await executor.query(
    "UPDATE print_jobs SET status = 'payment_processing' WHERE id = ?",
    [printJobId],
  );
}

export async function failPrintCheckout(paymentId, printJobId, executor = pool) {
  await executor.query(
    "UPDATE payments SET status = 'failed', failure_code = 'PAYMENT_CREATE_FAILED' WHERE id = ? AND status = 'created'",
    [paymentId],
  );
  await executor.query(
    "UPDATE print_jobs SET status = 'quoted' WHERE id = ? AND status = 'payment_processing'",
    [printJobId],
  );
}

export async function findPaymentForPrintJob(printJobId, executor = pool, lock = false) {
  const [rows] = await executor.query(
    `SELECT
       id, public_id, print_job_id, provider, provider_order_id,
       provider_capture_id, amount_agorot, currency, status,
       failure_code, completed_at, created_at, updated_at
     FROM payments
     WHERE print_job_id = ?
     ORDER BY created_at DESC
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [printJobId],
  );
  return rows[0] ?? null;
}

export async function attachPrintProviderOrder(
  paymentId,
  providerOrderId,
  executor = pool,
) {
  await executor.query(
    "UPDATE payments SET provider_order_id = ? WHERE id = ?",
    [providerOrderId, paymentId],
  );
  await executor.query(
    `UPDATE print_jobs pj
     JOIN payments p ON p.print_job_id = pj.id
     SET pj.status = 'pending_payment'
     WHERE p.id = ?`,
    [paymentId],
  );
}

export async function setPrintPaymentProcessing(paymentId, printJobId, executor) {
  await executor.query(
    "UPDATE payments SET status = 'processing' WHERE id = ?",
    [paymentId],
  );
  await executor.query(
    "UPDATE print_jobs SET status = 'payment_processing' WHERE id = ?",
    [printJobId],
  );
}

export async function completePrintPayment(data, executor) {
  await executor.query(
    `UPDATE payments
     SET status = 'completed', provider_capture_id = ?, completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [data.providerCaptureId, data.paymentId],
  );
  await executor.query(
    "UPDATE print_jobs SET status = 'paid' WHERE id = ?",
    [data.printJobId],
  );
}

export async function createPrintCancellationRequest(data, executor = pool) {
  await executor.query(
    `INSERT INTO cancellation_requests (
      public_id, requester_user_id, print_job_id, reason
    ) VALUES (?, ?, ?, ?)`,
    [data.publicId, data.userId, data.printJobId, data.reason],
  );
}

export async function findPrintFile(publicId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      pf.*, pj.user_id, pj.vendor_id, pj.public_id AS print_job_public_id
     FROM print_files pf
     JOIN print_jobs pj ON pj.id = pf.print_job_id
     WHERE pf.public_id = ? AND pf.deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function listExpiredPrintFiles(limit = 50, executor = pool) {
  const [rows] = await executor.query(
    `SELECT pf.id
     FROM print_files pf
     JOIN print_jobs pj ON pj.id = pf.print_job_id
     WHERE pf.deleted_at IS NULL
       AND pj.retention_delete_at IS NOT NULL
       AND pj.retention_delete_at < CURRENT_TIMESTAMP
     LIMIT ?`,
    [limit],
  );
  return rows;
}

export async function markPrintFileDeleted(id, executor = pool) {
  await executor.query(
    `UPDATE print_files
     SET file_data = X'', deleted_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
  );
}
