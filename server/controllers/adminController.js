import * as admin from "../services/adminService.js";
import * as maintenance from "../services/maintenanceService.js";

const context = (request) => ({ requestId: request.id, ip: request.ip });

export async function usersHandler(request, response) {
  response.json(await admin.adminUsers(request.query));
}

export async function blockUserHandler(request, response) {
  await admin.blockUser(
    request.user,
    request.params.publicId,
    request.body.blocked,
    context(request),
  );
  response.status(204).end();
}

export async function vendorsHandler(request, response) {
  response.json(await admin.adminVendors(request.query));
}

export async function vendorStatusHandler(request, response) {
  await admin.changeVendorStatus(
    request.user,
    request.params.publicId,
    request.body.status,
    context(request),
  );
  response.status(204).end();
}

export async function buildingsHandler(_request, response) {
  response.json({ data: await admin.adminBuildings() });
}

export async function createBuildingHandler(request, response) {
  response.status(201).json({
    data: await admin.addBuilding(request.user, request.body, context(request)),
  });
}

export async function updateBuildingHandler(request, response) {
  response.json({
    data: await admin.editBuilding(
      request.user,
      request.params.id,
      request.body,
      context(request),
    ),
  });
}

export async function auditHandler(request, response) {
  response.json(await admin.auditLogs(request.query));
}

export async function maintenanceHandler(request, response) {
  response.json(await maintenance.adminMaintenanceTickets(request.query));
}

export async function maintenanceDetailsHandler(request, response) {
  response.json({
    data: await maintenance.maintenanceDetails(request.user, request.params.publicId),
  });
}

export async function updateMaintenanceHandler(request, response) {
  response.json({
    data: await maintenance.updateMaintenance(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

export async function commentMaintenanceHandler(request, response) {
  response.status(201).json({
    data: await maintenance.addMaintenanceComment(
      request.user,
      request.params.publicId,
      request.body,
      context(request),
    ),
  });
}

