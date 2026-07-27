import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { withTransaction } from "../db/pool.js";
import { buildingExists } from "../models/catalogModel.js";
import {
  addVendorMembership,
  createUser,
  createVendor,
  findUserByEmail,
  findVendorMembership,
  softDeleteOwnAccount,
  updateOwnProfile,
} from "../models/userModel.js";
import { writeAudit } from "../models/auditModel.js";
import { AppError, conflict } from "../utils/AppError.js";
import { publicId } from "../utils/identifiers.js";

const DUMMY_PASSWORD_HASH = "$2b$12$dg4nQopiN56SkxK.Vp795.fgWh16OVS0Mosh3PEnjV7LawXDzoaiu";

function safeUser(user, membership = null) {
  return {
    publicId: user.public_id,
    email: user.email,
    displayName: user.display_name,
    phone: user.phone,
    customerType: user.customer_type,
    role: user.role,
    vendor: membership
      ? {
        publicId: membership.vendor_public_id,
        name: membership.vendor_name,
        slug: membership.vendor_slug,
        type: membership.vendor_type,
        status: membership.vendor_status,
      }
      : null,
  };
}

function signToken(user) {
  return jwt.sign(
    { role: user.role },
    config.jwt.secret,
    {
      subject: user.public_id,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: config.jwt.expiresIn,
    },
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function customerDomainAllowed(email) {
  const domain = email.split("@")[1] ?? "";
  return config.allowedCustomerEmailDomains.includes(domain);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function registerCustomer(input, context) {
  const email = normalizeEmail(input.email);
  if (!customerDomainAllowed(email)) {
    throw new AppError(
      400,
      "CAMPUS_EMAIL_REQUIRED",
      `Use an approved campus email domain: ${config.allowedCustomerEmailDomains.join(", ")}`,
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({
    publicId: publicId(),
    email,
    displayName: input.displayName,
    phone: input.phone,
    customerType: input.customerType,
    role: "customer",
    passwordHash,
  }).catch((error) => {
    if (error.code === "ER_DUP_ENTRY") {
      throw conflict("An account already uses that email", "EMAIL_IN_USE");
    }
    throw error;
  });

  await writeAudit({
    actorUserId: user.id,
    action: "customer.register",
    resourceType: "user",
    resourcePublicId: user.public_id,
    requestId: context.requestId,
    ip: context.ip,
  });

  return { user: safeUser(user), token: signToken(user) };
}

export async function registerPartner(input, context) {
  const email = normalizeEmail(input.email);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const slugBase = slugify(input.vendorName);
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

  return withTransaction(async (connection) => {
    if (!(await buildingExists(input.buildingId, connection))) {
      throw new AppError(400, "INVALID_BUILDING", "Select an active campus building");
    }
    const user = await createUser({
      publicId: publicId(),
      email,
      displayName: input.displayName,
      phone: input.phone,
      role: "vendor_manager",
      passwordHash,
    }, connection).catch((error) => {
      if (error.code === "ER_DUP_ENTRY") {
        throw conflict("An account already uses that email", "EMAIL_IN_USE");
      }
      throw error;
    });

    const vendorPublicId = publicId();
    const vendorId = await createVendor({
      publicId: vendorPublicId,
      buildingId: input.buildingId,
      name: input.vendorName,
      slug,
      vendorType: input.vendorType,
      description: input.description,
      contactEmail: email,
      contactPhone: input.phone,
    }, connection);
    await addVendorMembership(user.id, vendorId, "owner", connection);

    await writeAudit({
      actorUserId: user.id,
      action: "partner.register",
      resourceType: "vendor",
      resourcePublicId: vendorPublicId,
      summary: `Registered ${input.vendorType}`,
      requestId: context.requestId,
      ip: context.ip,
    }, connection);

    const membership = await findVendorMembership(user.id, connection);
    return { user: safeUser(user, membership), token: signToken(user) };
  });
}

export async function login(input, expectedRole, context) {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);
  const matches = user
    ? await bcrypt.compare(input.password, user.password_hash)
    : await bcrypt.compare(input.password, DUMMY_PASSWORD_HASH);

  if (!user || !matches) {
    await writeAudit({
      action: "auth.login",
      resourceType: "user",
      outcome: "failure",
      summary: "Invalid credentials",
      requestId: context.requestId,
      ip: context.ip,
    });
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }
  if (user.blocked_at || user.deleted_at) {
    throw new AppError(403, "ACCOUNT_UNAVAILABLE", "This account is unavailable");
  }
  if (expectedRole && user.role !== expectedRole) {
    throw new AppError(403, "WRONG_PORTAL", "Use the sign-in page for your account type");
  }

  const membership = user.role === "vendor_manager"
    ? await findVendorMembership(user.id)
    : null;
  if (user.role === "vendor_manager" && (!membership || membership.vendor_status !== "active")) {
    throw new AppError(403, "VENDOR_UNAVAILABLE", "This vendor account is unavailable");
  }

  await writeAudit({
    actorUserId: user.id,
    action: "auth.login",
    resourceType: "user",
    resourcePublicId: user.public_id,
    requestId: context.requestId,
    ip: context.ip,
  });

  return { user: safeUser(user, membership), token: signToken(user) };
}

export async function currentUser(user) {
  const membership = user.role === "vendor_manager"
    ? await findVendorMembership(user.id)
    : null;
  return safeUser(user, membership);
}

export async function updateProfile(user, input) {
  const updated = await updateOwnProfile(user.id, input);
  return safeUser(updated, user.role === "vendor_manager"
    ? await findVendorMembership(user.id)
    : null);
}

export async function deleteProfile(user, context) {
  await softDeleteOwnAccount(user.id);
  await writeAudit({
    actorUserId: user.id,
    action: "user.delete_self",
    resourceType: "user",
    resourcePublicId: user.public_id,
    requestId: context.requestId,
    ip: context.ip,
  });
}

export async function createSeedUser(data) {
  const existing = await findUserByEmail(normalizeEmail(data.email));
  if (existing) return existing;
  return createUser({
    publicId: publicId(),
    email: normalizeEmail(data.email),
    displayName: data.displayName,
    customerType: data.customerType,
    role: data.role,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
}

export { safeUser };
