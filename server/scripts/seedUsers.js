import { pool, withTransaction } from "../db/pool.js";
import { addVendorMembership, findVendorMembership } from "../repositories/userRepository.js";
import { createSeedUser } from "../services/authService.js";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const admin = await createSeedUser({
  email: required("SEED_ADMIN_EMAIL", "admin@jct.ac.il"),
  password: required("SEED_ADMIN_PASSWORD"),
  displayName: "LevGo Administrator",
  role: "admin",
});

const customer = await createSeedUser({
  email: required("SEED_CUSTOMER_EMAIL", "student@jct.ac.il"),
  password: required("SEED_CUSTOMER_PASSWORD"),
  displayName: "Demo Student",
  customerType: "student",
  role: "customer",
});

const partner = await createSeedUser({
  email: required("SEED_PARTNER_EMAIL", "partner@example.com"),
  password: required("SEED_PARTNER_PASSWORD"),
  displayName: "Print Lab Manager",
  role: "vendor_manager",
});

await withTransaction(async (connection) => {
  if (await findVendorMembership(partner.id, connection)) return;
  const [rows] = await connection.query(
    "SELECT id FROM vendors WHERE slug = 'lev-print-lab' AND deleted_at IS NULL LIMIT 1",
  );
  if (!rows[0]) {
    throw new Error("Run database/seed.sql before seed:users");
  }
  await addVendorMembership(partner.id, rows[0].id, "owner", connection);
});

console.log(JSON.stringify({
  createdOrFound: {
    admin: admin.email,
    customer: customer.email,
    partner: partner.email,
  },
}));

await pool.end();

