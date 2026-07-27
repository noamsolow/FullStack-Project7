import * as partner from "../services/partnerService.js";
import * as orders from "../services/orderService.js";
import * as printing from "../services/printService.js";

const context = (request) => ({ requestId: request.id, ip: request.ip });

export async function vendorHandler(request, response) {
  response.json({ data: await partner.partnerVendor(request.user) });
}

export async function updateVendorHandler(request, response) {
  response.json({
    data: await partner.editPartnerVendor(request.user, request.body, context(request)),
  });
}

export async function productsHandler(request, response) {
  response.json(await partner.partnerProducts(request.user, request.query));
}

export async function createProductHandler(request, response) {
  response.status(201).json({
    data: await partner.addProduct(request.user, request.body, context(request)),
  });
}

export async function updateProductHandler(request, response) {
  response.json({
    data: await partner.editProduct(
      request.user,
      request.params.productPublicId,
      request.body,
      context(request),
    ),
  });
}

export async function deleteProductHandler(request, response) {
  await partner.removeProduct(
    request.user,
    request.params.productPublicId,
    context(request),
  );
  response.status(204).end();
}

export async function uploadProductImageHandler(request, response) {
  response.status(201).json({
    data: await partner.uploadProductImage(
      request.user,
      request.params.productPublicId,
      request.file,
      request.body,
      context(request),
    ),
  });
}

export async function zonesHandler(request, response) {
  response.json({ data: await partner.partnerDeliveryZones(request.user) });
}

export async function saveZoneHandler(request, response) {
  response.json({
    data: await partner.saveDeliveryZone(request.user, request.body, context(request)),
  });
}

export async function ordersHandler(request, response) {
  response.json(await orders.partnerOrders(request.user, request.query));
}

export async function orderDetailsHandler(request, response) {
  response.json({
    data: await orders.orderDetails(request.user, request.params.publicId),
  });
}

export async function updateOrderHandler(request, response) {
  response.json({
    data: await orders.updatePartnerOrder(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

export async function printJobsHandler(request, response) {
  response.json(await printing.partnerPrintJobs(request.user, request.query));
}

export async function printJobDetailsHandler(request, response) {
  response.json({
    data: await printing.printJobDetails(request.user, request.params.publicId),
  });
}

export async function quotePrintHandler(request, response) {
  response.json({
    data: await printing.setPrintQuote(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

export async function updatePrintHandler(request, response) {
  response.json({
    data: await printing.updatePrintStatus(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

