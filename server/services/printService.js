import { withTransaction } from "../db/connection.js";
import { writeAudit } from "../models/auditModel.js";
import { findVendorByPublicId } from "../models/catalogModel.js";
import {
  addPrintHistory,
  createPrintCancellationRequest,
  createPrintJob,
  findPaymentForPrintJob,
  findPrintFileBufferByJobId,
  findPrintJobByPublicId,
  insertPrintFile,
  listCustomerPrintJobs,
  listPrintHistory,
  listVendorPrintJobs,
  quotePrintJob,
  setPrintStatus,
} from "../models/printModel.js";
import { AppError, conflict, forbidden, notFound } from "../utils/AppError.js";
import {
  pdfPageCount,
  safeOriginalName,
  sha256,
  validatePdf,
} from "../utils/files.js";
import { publicId, referenceNumber, shortCode } from "../utils/identifiers.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import {
  calculatePrintPriceAgorot,
  printPriceNote,
} from "../utils/printPricing.js";
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
  const pageCount = await pdfPageCount(file.buffer);
  if (input.laminated && input.paperSize !== "A4") {
    throw new AppError(400, "LAMINATION_A4_ONLY", "Lamination is available for A4 printing only");
  }
  const quoteAgorot = calculatePrintPriceAgorot({
    pageCount,
    copies: input.copies,
    colorMode: input.colorMode,
    sides: input.sides,
    laminated: input.laminated,
    spiralBound: input.spiralBound,
  });
  const pricingNote = printPriceNote({
    pageCount,
    copies: input.copies,
    colorMode: input.colorMode,
    sides: input.sides,
    laminated: input.laminated,
    spiralBound: input.spiralBound,
    totalAgorot: quoteAgorot,
  });
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
      laminated: input.laminated,
      spiralBound: input.spiralBound,
      customerNote: input.customerNote,
      quoteAgorot,
      status: "submitted",
      pickupCode: shortCode(),
    }, connection);
    await insertPrintFile({
      publicId: filePublicId,
      printJobId,
      originalName: safeOriginalName(file.originalname),
      sizeBytes: file.size,
      fileData: file.buffer,
      sha256: sha256(file.buffer),
    }, connection);
    await addPrintHistory({
      printJobId,
      actorUserId: user.id,
      toStatus: "submitted",
      note: `${pricingNote} Waiting for the print center to begin production.`,
    }, connection);
  });

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
    if (!["submitted", "quoted"].includes(job.status)) {
      throw conflict("This print job already has a confirmed fixed price", "PRINT_NOT_QUOTABLE");
    }
    const fileBuffer = await findPrintFileBufferByJobId(job.id, connection);
    if (!fileBuffer) throw notFound("Print file not found");
    const pageCount = await pdfPageCount(fileBuffer);
    const quoteAgorot = calculatePrintPriceAgorot({
      pageCount,
      copies: job.copies,
      colorMode: job.color_mode,
      sides: job.sides,
      laminated: job.laminated,
      spiralBound: job.spiral_bound,
    });
    const pricingNote = printPriceNote({
      pageCount,
      copies: job.copies,
      colorMode: job.color_mode,
      sides: job.sides,
      laminated: job.laminated,
      spiralBound: job.spiral_bound,
      totalAgorot: quoteAgorot,
    });
    await quotePrintJob(job.id, quoteAgorot, "paid", connection);
    await addPrintHistory({
      printJobId: job.id,
      actorUserId: user.id,
      fromStatus: job.status,
      toStatus: "paid",
      note: input.note ? `${pricingNote} ${input.note}` : pricingNote,
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
