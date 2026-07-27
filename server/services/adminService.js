import { listAuditLogs, writeAudit } from "../repositories/auditRepository.js";
import {
  createBuilding,
  listAdminVendors,
  setVendorStatus,
  updateBuilding,
} from "../repositories/adminRepository.js";
import {
  listBuildingRows,
} from "../repositories/catalogRepository.js";
import {
  listUsers,
  setUserBlocked,
} from "../repositories/userRepository.js";
import { AppError, notFound } from "../utils/AppError.js";
import { paginated, paginationFrom } from "../utils/pagination.js";

export async function adminUsers(query) {
  const paging = paginationFrom(query);
  const rows = await listUsers({ ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function blockUser(admin, publicId, blocked, context) {
  if (admin.public_id === publicId && blocked) {
    throw new AppError(
      400,
      "SELF_BLOCK_FORBIDDEN",
      "Administrators cannot block their own active session",
    );
  }
  if (!(await setUserBlocked(publicId, blocked))) throw notFound("User not found");
  await writeAudit({
    actorUserId: admin.id,
    action: blocked ? "admin.user_block" : "admin.user_unblock",
    resourceType: "user",
    resourcePublicId: publicId,
    requestId: context.requestId,
  });
}

export async function adminVendors(query) {
  const paging = paginationFrom(query);
  const rows = await listAdminVendors({ ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function changeVendorStatus(admin, publicId, status, context) {
  if (!(await setVendorStatus(publicId, status))) throw notFound("Vendor not found");
  await writeAudit({
    actorUserId: admin.id,
    action: `admin.vendor_${status}`,
    resourceType: "vendor",
    resourcePublicId: publicId,
    requestId: context.requestId,
  });
}

export async function adminBuildings() {
  return listBuildingRows();
}

export async function addBuilding(admin, input, context) {
  const id = await createBuilding(input);
  await writeAudit({
    actorUserId: admin.id,
    action: "admin.building_create",
    resourceType: "building",
    resourcePublicId: String(id),
    requestId: context.requestId,
  });
  return listBuildingRows();
}

export async function editBuilding(admin, id, input, context) {
  if (!(await updateBuilding(id, input))) throw notFound("Building not found");
  await writeAudit({
    actorUserId: admin.id,
    action: "admin.building_update",
    resourceType: "building",
    resourcePublicId: String(id),
    requestId: context.requestId,
  });
  return listBuildingRows();
}

export async function auditLogs(query) {
  const paging = paginationFrom(query);
  const rows = await listAuditLogs({ ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}
