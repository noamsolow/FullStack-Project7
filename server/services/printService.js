import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/index.js";
import { withTransaction } from "../db/pool.js";
import { findVendorByPublicId } from "../repositories/catalogRepository.js";
import {
  addPrintHistory,
  attachPrintProviderOrder,
  beginPrintCheckout,
  completePrintPayment,
  createPrintCancellationRequest,
  createPrintJob,
  createPrintPayment,
  failPrintCheckout,
  findPaymentForPrintJob,
  findPrintJobByPublicId,
  insertPrintFile,
  listCustomerPrintJobs,
  listPrintHistory,
  listVendorPrintJobs,
  quotePrintJob,
  setPrintPaymentProcessing,
  setPrintStatus,
} from "../repositories/printRepository.js";
import { writeAudit } from "../repositories/auditRepository.js";
import {
  capturePayPalOrder,
  captureSummary,
  createPayPalOrder,
  getPayPalOrder,
} from "../integrations/paypalClient.js";
import { AppError, conflict, forbidden, notFound } from "../utils/AppError.js";
import {
  safeOriginalName,
  sha256,
  storageName,
  validatePdf,
} from "../utils/files.js";
import { publicId, referenceNumber, shortCode } from "../utils/identifiers.js";
import { payPalToAgorot } from "../utils/money.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import { canTransition, printTransitions } from "../utils/statusRules.js";
import { requireMembership } from "./partnerService.js";

function canRead(user, job, membership) {
  return user.role === "admin"
    || job.user_id === user.id
    || (membership && membership.vendor_id === job.vendor_id);
}

export async function submitPrintJob(user, input, file, context) {
  if (!file) throw new AppError(400, "FILE_REQUIRED", "Choose a PDF to print");
  validatePdf(file);
  const vendor = await findVendorByPublicId(input.vendorPublicId);
  if (
    !vendor
    || vendor.vendor_type !== "print_center"
    || vendor.status !== "active"
    || !vendor.is_open
  ) {
    throw new AppError(400, "PRINT_CENTER_UNAVAILABLE", "Select an available print center");
  }

  const jobPublicId = publicId();
  const filePublicId = publicId();
  const storedName = storageName(".pdf");
  const target = path.join(config.storage.printFiles, storedName);
  await fs.writeFile(target, file.buffer, { flag: "wx" });

  try {
    await withTransaction(async (connection) => {
      const printJobId = await createPrintJob({
        publicId: jobPublicId,
        jobNumber: referenceNumber("PR"),
        userId: user.id,
        vendorId: vendor.id,
        paperSize: input.paperSize,
        colorMode: input.colorMode,
        sides: input.sides,
        copies: input.copies,
        stapled: input.stapled,
        customerNote: input.customerNote,
        pickupCode: shortCode(),
      }, connection);
      await insertPrintFile({
        publicId: filePublicId,
        printJobId,
        storageName: storedName,
        originalName: safeOriginalName(file.originalname),
        sizeBytes: file.size,
        sha256: sha256(file.buffer),
      }, connection);
      await addPrintHistory({
        printJobId,
        actorUserId: user.id,
        toStatus: "submitted",
        note: "Submitted for private review and quote",
      }, connection);
    });
  } catch (error) {
    await fs.unlink(target).catch(() => {});
    throw error;
  }

  await writeAudit({
    actorUserId: user.id,
    action: "print.submit",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return printJobDetails(user, jobPublicId);
}

export async function printJobDetails(user, jobPublicId) {
  const job = await findPrintJobByPublicId(jobPublicId);
  if (!job) throw notFound("Print job not found");
  const membership = user.role === "vendor_manager"
    ? await requireMembership(user.id)
    : null;
  if (!canRead(user, job, membership)) throw forbidden();
  const [history, payment] = await Promise.all([
    listPrintHistory(job.id),
    findPaymentForPrintJob(job.id),
  ]);
  delete job.id;
  delete job.user_id;
  delete job.vendor_id;
  return {
    ...job,
    history,
    payment: payment
      ? {
        status: payment.status,
        amountAgorot: payment.amount_agorot,
        currency: payment.currency,
      }
      : null,
  };
}

export async function customerPrintJobs(user, query) {
  const paging = paginationFrom(query);
  const rows = await listCustomerPrintJobs(user.id, { ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function partnerPrintJobs(user, query) {
  const membership = await requireMembership(user.id);
  if (membership.vendor_type !== "print_center") {
    throw new AppError(403, "PRINT_CENTER_REQUIRED", "This area is for print centers");
  }
  const paging = paginationFrom(query);
  const rows = await listVendorPrintJobs(membership.vendor_id, { ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function setPrintQuote(user, jobPublicId, input, context) {
  const membership = await requireMembership(user.id);
  if (membership.vendor_type !== "print_center") {
    throw new AppError(403, "PRINT_CENTER_REQUIRED", "This area is for print centers");
  }
  await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    if (!job || job.vendor_id !== membership.vendor_id) throw notFound("Print job not found");
    if (job.status !== "submitted") {
      throw conflict("Only submitted jobs can be quoted", "PRINT_NOT_QUOTABLE");
    }
    await quotePrintJob(job.id, input.quoteAgorot, connection);
    await addPrintHistory({
      printJobId: job.id,
      actorUserId: user.id,
      fromStatus: "submitted",
      toStatus: "quoted",
      note: input.note ?? "Quote valid for 24 hours",
    }, connection);
  });
  await writeAudit({
    actorUserId: user.id,
    action: "print.quote",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return printJobDetails(user, jobPublicId);
}

export async function createPrintCheckout(user, jobPublicId, context) {
  const stored = await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    if (!job) throw notFound("Print job not found");
    if (job.user_id !== user.id) throw forbidden();
    if (job.status !== "quoted" || !job.quote_agorot) {
      throw conflict("This print job is not ready for payment", "PRINT_NOT_PAYABLE");
    }
    if (new Date(job.quote_expires_at).getTime() < Date.now()) {
      throw conflict("The print quote expired; request a new quote", "QUOTE_EXPIRED");
    }
    const existingPayment = await findPaymentForPrintJob(job.id, connection);
    if (existingPayment && existingPayment.status !== "failed") {
      throw conflict("A payment checkout already exists", "PAYMENT_EXISTS");
    }
    const paymentId = await createPrintPayment({
      publicId: publicId(),
      printJobId: job.id,
      amountAgorot: job.quote_agorot,
    }, connection);
    await beginPrintCheckout(job.id, connection);
    return {
      job,
      paymentId,
      amountAgorot: job.quote_agorot,
    };
  });

  let paypal;
  try {
    paypal = await createPayPalOrder({
      referenceId: jobPublicId,
      description: `LevGo print job ${stored.job.job_number}`,
      amountAgorot: stored.amountAgorot,
    });
    await attachPrintProviderOrder(stored.paymentId, paypal.providerOrderId);
  } catch (error) {
    await failPrintCheckout(stored.paymentId, stored.job.id).catch(() => {});
    throw error;
  }

  await writeAudit({
    actorUserId: user.id,
    action: "print.checkout",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return {
    printJobPublicId: jobPublicId,
    approvalUrl: paypal.approvalUrl,
    amountAgorot: stored.amountAgorot,
    currency: "ILS",
  };
}

function verifyPrintCapture(summary, payment) {
  if (
    summary.orderStatus !== "COMPLETED"
    || summary.captureStatus !== "COMPLETED"
    || !summary.providerCaptureId
    || summary.providerOrderId !== payment.provider_order_id
    || summary.currency !== payment.currency
    || payPalToAgorot(summary.amountValue) !== payment.amount_agorot
  ) {
    throw new AppError(
      409,
      "PAYMENT_VERIFICATION_FAILED",
      "The captured payment does not match this print job",
    );
  }
}

export async function capturePrintPayment(user, jobPublicId, input, context) {
  const initial = await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    if (!job) throw notFound("Print job not found");
    if (job.user_id !== user.id) throw forbidden();
    const payment = await findPaymentForPrintJob(job.id, connection, true);
    if (!payment || payment.provider_order_id !== input.providerOrderId) {
      throw new AppError(400, "PAYMENT_MISMATCH", "Payment does not belong to this print job");
    }
    if (payment.status === "completed") return { completed: true };
    if (!["pending_payment", "payment_processing"].includes(job.status)) {
      throw conflict("This print job can no longer be paid", "PRINT_NOT_PAYABLE");
    }
    await setPrintPaymentProcessing(payment.id, job.id, connection);
    return { job, payment, completed: false };
  });
  if (initial.completed) return printJobDetails(user, jobPublicId);

  let providerResponse = await getPayPalOrder(input.providerOrderId);
  if (providerResponse.status !== "COMPLETED") {
    providerResponse = await capturePayPalOrder(input.providerOrderId, jobPublicId);
  }
  const summary = captureSummary(providerResponse);
  verifyPrintCapture(summary, initial.payment);

  await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    const payment = await findPaymentForPrintJob(job.id, connection, true);
    if (payment.status === "completed") return;
    await completePrintPayment({
      paymentId: payment.id,
      providerCaptureId: summary.providerCaptureId,
      printJobId: job.id,
    }, connection);
    await addPrintHistory({
      printJobId: job.id,
      actorUserId: user.id,
      fromStatus: job.status,
      toStatus: "paid",
      note: "PayPal payment captured",
    }, connection);
  });

  await writeAudit({
    actorUserId: user.id,
    action: "payment.capture",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return printJobDetails(user, jobPublicId);
}

export async function updatePrintStatus(user, jobPublicId, input, context) {
  const membership = await requireMembership(user.id);
  await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    if (!job || job.vendor_id !== membership.vendor_id) throw notFound("Print job not found");
    if (!canTransition(printTransitions, job.status, input.status)) {
      throw conflict(`Cannot move a print job from ${job.status} to ${input.status}`, "INVALID_STATUS_TRANSITION");
    }
    await setPrintStatus(job.id, input.status, connection);
    await addPrintHistory({
      printJobId: job.id,
      actorUserId: user.id,
      fromStatus: job.status,
      toStatus: input.status,
      note: input.note,
    }, connection);
  });
  await writeAudit({
    actorUserId: user.id,
    action: "print.status_update",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return printJobDetails(user, jobPublicId);
}

export async function cancelOrRequestPrint(user, jobPublicId, input, context) {
  await withTransaction(async (connection) => {
    const job = await findPrintJobByPublicId(jobPublicId, connection, true);
    if (!job) throw notFound("Print job not found");
    if (job.user_id !== user.id) throw forbidden();
    if (["submitted", "quoted", "pending_payment"].includes(job.status)) {
      await setPrintStatus(job.id, "cancelled", connection);
      await addPrintHistory({
        printJobId: job.id,
        actorUserId: user.id,
        fromStatus: job.status,
        toStatus: "cancelled",
        note: input.reason,
      }, connection);
      return;
    }
    if (job.status === "paid") {
      await createPrintCancellationRequest({
        publicId: publicId(),
        userId: user.id,
        printJobId: job.id,
        reason: input.reason,
      }, connection);
      await setPrintStatus(job.id, "cancellation_requested", connection);
      await addPrintHistory({
        printJobId: job.id,
        actorUserId: user.id,
        fromStatus: "paid",
        toStatus: "cancellation_requested",
        note: "Manual refund review required",
      }, connection);
      return;
    }
    throw conflict("This print job can no longer be cancelled online", "CANCELLATION_UNAVAILABLE");
  });
  await writeAudit({
    actorUserId: user.id,
    action: "print.cancel_or_request",
    resourceType: "print_job",
    resourcePublicId: jobPublicId,
    requestId: context.requestId,
  });
  return printJobDetails(user, jobPublicId);
}
