import {
  capturePrintPayment,
  createPrintCheckout,
} from "../services/printPaymentService.js";
import * as printing from "../services/printService.js";

const context = (request) => ({ requestId: request.id, ip: request.ip });

export async function submitHandler(request, response) {
  response.status(201).json({
    data: await printing.submitPrintJob(
      request.user,
      request.body,
      request.file,
      context(request),
    ),
  });
}

export async function listHandler(request, response) {
  response.json(await printing.customerPrintJobs(request.user, request.query));
}

export async function detailsHandler(request, response) {
  response.json({
    data: await printing.printJobDetails(request.user, request.params.publicId),
  });
}

export async function checkoutHandler(request, response) {
  response.status(201).json({
    data: await createPrintCheckout(
      request.user,
      request.params.publicId,
      context(request),
    ),
  });
}

export async function captureHandler(request, response) {
  response.json({
    data: await capturePrintPayment(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

export async function cancelHandler(request, response) {
  response.json({
    data: await printing.cancelOrRequestPrint(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}
