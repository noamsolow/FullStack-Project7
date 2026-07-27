import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/index.js";
import { withTransaction } from "../db/pool.js";
import { buildingExists } from "../repositories/catalogRepository.js";
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
  updateMaintenanceTicket,
} from "../repositories/maintenanceRepository.js";
import { findSafeUserByPublicId } from "../repositories/userRepository.js";
import { writeAudit } from "../repositories/auditRepository.js";
import { AppError, forbidden, notFound } from "../utils/AppError.js";
import {
  safeOriginalName,
  storageName,
  validateImage,
} from "../utils/files.js";
import { publicId, referenceNumber } from "../utils/identifiers.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import { canTransition, maintenanceTransitions } from "../utils/statusRules.js";

export async function submitMaintenanceTicket(user, input, files, context) {
  if (!(await buildingExists(input.buildingId))) {
    throw new AppError(400, "INVALID_BUILDING", "Select an active campus building");
  }

  const preparedFiles = (files ?? []).map((file) => {
    const extension = validateImage(file);
    return {
      file,
      publicId: publicId(),
      storedName: storageName(extension),
    };
  });

  for (const item of preparedFiles) {
    await fs.writeFile(
      path.join(config.storage.maintenance, item.storedName),
      item.file.buffer,
      { flag: "wx" },
    );
  }

  const ticketPublicId = publicId();
  try {
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
          storageName: item.storedName,
          originalName: safeOriginalName(item.file.originalname),
          mimeType: item.file.mimetype,
          sizeBytes: item.file.size,
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
  } catch (error) {
    await Promise.all(preparedFiles.map((item) => fs.unlink(
      path.join(config.storage.maintenance, item.storedName),
    ).catch(() => {})));
    throw error;
  }

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
