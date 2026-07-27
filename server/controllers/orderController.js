import * as orders from "../services/orderService.js";

const context = (request) => ({ requestId: request.id, ip: request.ip });

export async function checkoutHandler(request, response) {
  response.status(201).json({
    data: await orders.checkout(request.user, request.body, context(request)),
  });
}

export async function captureHandler(request, response) {
  response.json({
    data: await orders.captureOrderPayment(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

export async function listHandler(request, response) {
  response.json(await orders.customerOrders(request.user, request.query));
}

export async function detailsHandler(request, response) {
  response.json({
    data: await orders.orderDetails(request.user, request.params.publicId),
  });
}

export async function cancelHandler(request, response) {
  response.json({
    data: await orders.cancelOrRequestOrder(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

