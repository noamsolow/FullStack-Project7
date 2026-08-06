import assert from "node:assert/strict";
import test from "node:test";
import { safeUser } from "../services/authService.js";

test("safe user responses never expose password or internal identity fields", () => {
  const result = safeUser({
    id: 42,
    public_id: "00000000-0000-4000-8000-000000000042",
    email: "student@g.jct.ac.il",
    display_name: "Test Student",
    phone: null,
    customer_type: "student",
    role: "customer",
    token_balance: 5000,
    password_hash: "must-never-leave-the-server",
  });

  assert.equal(result.publicId, "00000000-0000-4000-8000-000000000042");
  assert.equal(result.tokenBalance, 5000);
  assert.equal("password" in result, false);
  assert.equal("password_hash" in result, false);
  assert.equal("id" in result, false);
});
