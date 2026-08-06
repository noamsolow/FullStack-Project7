import { config } from "../config/index.js";
import { withTransaction } from "../db/connection.js";
import {
  capturePayPalOrder,
  captureSummary,
  createPayPalOrder,
  getPayPalOrder,
} from "../integrations/paypalClient.js";
import { writeAudit } from "../models/auditModel.js";
import {
  addPrintHistory,
  attachPrintProviderOrder,
  beginPrintCheckout,
  completePrintPayment,
  createPrintPayment,
  failPrintCheckout,
  findPaymentForPrintJob,
  findPrintJobByPublicId,
  setPrintPaymentProcessing,
  setPrintStatus,
} from "../models/printModel.js";
import { AppError, conflict, forbidden, notFound } from "../utils/AppError.js";
import { publicId } from "../utils/identifiers.js";
import { payPalToAgorot } from "../utils/money.js";
import { printJobDetails } from "./printService.js";

export async function createPrintCheckout(user, jobPublicId, context) {
  if (!config.paypal.enabled) {
    const confirmed = await withTransaction(async (connection) => {
      const job = await findPrintJobByPublicId(jobPublicId, connection, true);
      if (!job) throw notFound("Print job not found");
      if (job.user_id !== user.id) throw forbidden();
      if (job.status !== "quoted" || !job.quote_agorot) {
        throw conflict("This print job is not ready for confirmation", "PRINT_NOT_CONFIRMABLE");
      }
      if (new Date(job.quote_expires_at).getTime() < Date.now()) {
        throw conflict("The print quote expired; request a new quote", "QUOTE_EXPIRED");
      }
      await setPrintStatus(job.id, "paid", connection);
      await addPrintHistory({
        printJobId: job.id,
        actorUserId: user.id,
        fromStatus: "quoted",
        toStatus: "paid",
        note: "Quote approved without online payment",
      }, connection);
      return job;
    });

    await writeAudit({
      actorUserId: user.id,
      action: "print.quote_approve_without_payment",
      resourceType: "print_job",
      resourcePublicId: jobPublicId,
      requestId: context.requestId,
    });
    return {
      printJobPublicId: jobPublicId,
      amountAgorot: confirmed.quote_agorot,
      currency: "ILS",
      status: "paid",
      paymentRequired: false,
    };
  }

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
    paymentRequired: true,
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
  if (!config.paypal.enabled) {
    throw new AppError(409, "PAYMENTS_DISABLED", "Online payments are currently disabled");
  }
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
