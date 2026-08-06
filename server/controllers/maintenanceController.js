import * as maintenance from "../services/maintenanceService.js";

const context = (request) => ({ requestId: request.id, ip: request.ip });

export async function createHandler(request, response) {
  response.status(201).json({
    data: await maintenance.submitMaintenanceTicket(
      request.user,
      request.body,
      request.files,
      context(request),
    ),
  });
}

export async function listHandler(request, response) {
  response.json(await maintenance.customerMaintenanceTickets(request.user, request.query));
}

export async function detailsHandler(request, response) {
  response.json({
    data: await maintenance.maintenanceDetails(request.user, request.params.publicId),
  });
}

export async function commentsHandler(request, response) {
  response.json(await maintenance.maintenanceComments(
    request.user,
    request.params.publicId,
    request.query,
  ));
}

export async function historyHandler(request, response) {
  response.json(await maintenance.maintenanceHistory(
    request.user,
    request.params.publicId,
    request.query,
  ));
}

export async function commentHandler(request, response) {
  response.status(201).json({
    data: await maintenance.addMaintenanceComment(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}
