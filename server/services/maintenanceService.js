import { config } from "../config/index.js";
import { withTransaction } from "../db/connection.js";
import { buildingExists } from "../models/catalogModel.js";
import {
  addMaintenanceHistory,
  createMaintenanceTicket,
  findMaintenanceTicket,
  insertMaintenanceAttachment,
  insertMaintenanceComment,
  listAdminTickets,
  listCustomerTickets,
  listMaintenanceAttachments,
  listMaintenanceComments,
  listMaintenanceHistory,
  listMaintenanceTicketsForRoute,
  updateMaintenanceTicket,
} from "../models/maintenanceModel.js";
import { findSafeUserByPublicId } from "../models/userModel.js";
import { writeAudit } from "../models/auditModel.js";
import { planCampusTour } from "./campusRoutingService.js";
import { AppError, forbidden, notFound } from "../utils/AppError.js";
import {
  safeOriginalName,
  validateImage,
} from "../utils/files.js";
import { publicId, referenceNumber } from "../utils/identifiers.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import { canTransition, maintenanceTransitions } from "../utils/statusRules.js";

const MAINTENANCE_DEPOT_BUILDING = "37";
const ROUTABLE_MAINTENANCE_STATUSES = [
  "open",
  "acknowledged",
  "in_progress",
];

export async function submitMaintenanceTicket(user, input, files, context) {
  if (!(await buildingExists(input.buildingId))) {
    throw new AppError(400, "INVALID_BUILDING", "Select an active campus building");
  }

  const preparedFiles = (files ?? []).map((file) => {
    validateImage(file);
    return {
      file,
      publicId: publicId(),
    };
  });

  const ticketPublicId = publicId();
  await withTransaction(async (connection) => {
    const ticketId = await createMaintenanceTicket({
      publicId: ticketPublicId,
      ticketNumber: referenceNumber("MT"),
      userId: user.id,
      buildingId: input.buildingId,
      locationText: input.locationText,
      category: input.category,
      title: input.title,
      description: input.description,
      requestedPriority: input.requestedPriority,
    }, connection);
    for (const item of preparedFiles) {
      await insertMaintenanceAttachment({
        publicId: item.publicId,
        maintenanceTicketId: ticketId,
        originalName: safeOriginalName(item.file.originalname),
        mimeType: item.file.mimetype,
        sizeBytes: item.file.size,
        fileData: item.file.buffer,
      }, connection);
    }
    await addMaintenanceHistory({
      maintenanceTicketId: ticketId,
      actorUserId: user.id,
      eventType: "status",
      toValue: "open",
      note: "Ticket submitted",
    }, connection);
  });

  await writeAudit({
    actorUserId: user.id,
    action: "maintenance.create",
    resourceType: "maintenance_ticket",
    resourcePublicId: ticketPublicId,
    requestId: context.requestId,
  });
  return maintenanceDetails(user, ticketPublicId);
}

export async function maintenanceDetails(user, publicIdValue) {
  const ticket = await findMaintenanceTicket(publicIdValue);
  if (!ticket) throw notFound("Maintenance ticket not found");
  if (user.role !== "admin" && ticket.reporter_user_id !== user.id) {
    throw forbidden();
  }
  const [attachments, comments, history] = await Promise.all([
    listMaintenanceAttachments(ticket.id),
    listMaintenanceComments(ticket.id, user.role === "admin"),
    listMaintenanceHistory(ticket.id),
  ]);
  delete ticket.id;
  delete ticket.reporter_user_id;
  delete ticket.assigned_admin_id;
  return {
    ...ticket,
    attachments,
    comments,
    history,
    emergencyContactMessage: ticket.priority === "urgent"
      ? config.emergencyContactMessage
      : null,
  };
}

export async function customerMaintenanceTickets(user, query) {
  const paging = paginationFrom(query);
  const rows = await listCustomerTickets(user.id, { ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function adminMaintenanceTickets(query) {
  const paging = paginationFrom(query);
  const rows = await listAdminTickets({ ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function maintenanceRoutePlan() {
  const tickets = await listMaintenanceTicketsForRoute(
    ROUTABLE_MAINTENANCE_STATUSES,
  );
  const ticketsByBuilding = new Map();

  tickets.forEach((ticket) => {
    if (!ticketsByBuilding.has(ticket.campus_code)) {
      ticketsByBuilding.set(ticket.campus_code, []);
    }
    ticketsByBuilding.get(ticket.campus_code).push(ticket);
  });

  const tour = await planCampusTour(
    [...ticketsByBuilding.keys()],
    MAINTENANCE_DEPOT_BUILDING,
  );
  const stops = tour.visitOrder
    .map((campusCode) => ({
      campusCode,
      buildingName: ticketsByBuilding.get(campusCode)?.[0]?.building_name ?? null,
      tickets: ticketsByBuilding.get(campusCode) ?? [],
    }))
    .filter((stop) => stop.tickets.length > 0);

  return {
    depotBuilding: MAINTENANCE_DEPOT_BUILDING,
    includedStatuses: [...ROUTABLE_MAINTENANCE_STATUSES],
    ticketCount: tickets.length,
    stopCount: stops.length,
    cycle: tour.cycle,
    legs: tour.legs,
    totalDistanceMeters: tour.totalDistanceMeters,
    totalStairsDistanceMeters: tour.totalStairsDistanceMeters,
    totalWeight: tour.totalWeight,
    stops,
  };
}

export async function addMaintenanceComment(user, publicIdValue, input, context) {
  const ticket = await findMaintenanceTicket(publicIdValue);
  if (!ticket) throw notFound("Maintenance ticket not found");
  if (user.role !== "admin" && ticket.reporter_user_id !== user.id) {
    throw forbidden();
  }
  if (input.isInternal && user.role !== "admin") {
    throw forbidden("Only administrators can add internal notes");
  }
  if (["closed", "rejected"].includes(ticket.status)) {
    throw new AppError(409, "TICKET_CLOSED", "This ticket no longer accepts comments");
  }

  await insertMaintenanceComment({
    publicId: publicId(),
    maintenanceTicketId: ticket.id,
    authorUserId: user.id,
    body: input.body,
    isInternal: input.isInternal,
  });
  await writeAudit({
    actorUserId: user.id,
    action: "maintenance.comment",
    resourceType: "maintenance_ticket",
    resourcePublicId: publicIdValue,
    requestId: context.requestId,
  });
  return maintenanceDetails(user, publicIdValue);
}

export async function updateMaintenance(user, publicIdValue, input, context) {
  await withTransaction(async (connection) => {
    const ticket = await findMaintenanceTicket(publicIdValue, connection, true);
    if (!ticket) throw notFound("Maintenance ticket not found");
    if (
      input.status !== ticket.status
      && !canTransition(maintenanceTransitions, ticket.status, input.status)
    ) {
      throw new AppError(
        409,
        "INVALID_STATUS_TRANSITION",
        `Cannot move a ticket from ${ticket.status} to ${input.status}`,
      );
    }
    let assignedAdminId = ticket.assigned_admin_id;
    if (input.assignedAdminPublicId) {
      const assignee = await findSafeUserByPublicId(
        input.assignedAdminPublicId,
        connection,
      );
      if (!assignee || assignee.role !== "admin" || assignee.blocked_at) {
        throw new AppError(400, "INVALID_ADMIN", "Select an active administrator");
      }
      assignedAdminId = assignee.id;
    } else if (!assignedAdminId) {
      assignedAdminId = user.id;
    }

    await updateMaintenanceTicket(ticket.id, {
      status: input.status,
      priority: input.priority,
      assignedAdminId,
    }, connection);
    if (ticket.status !== input.status) {
      await addMaintenanceHistory({
        maintenanceTicketId: ticket.id,
        actorUserId: user.id,
        eventType: "status",
        fromValue: ticket.status,
        toValue: input.status,
        note: input.note,
      }, connection);
    }
    if (ticket.priority !== input.priority) {
      await addMaintenanceHistory({
        maintenanceTicketId: ticket.id,
        actorUserId: user.id,
        eventType: "priority",
        fromValue: ticket.priority,
        toValue: input.priority,
      }, connection);
    }
  });

  await writeAudit({
    actorUserId: user.id,
    action: "maintenance.update",
    resourceType: "maintenance_ticket",
    resourcePublicId: publicIdValue,
    requestId: context.requestId,
  });
  return maintenanceDetails(user, publicIdValue);
}
