import assert from "node:assert/strict";
import test from "node:test";
import {
  DatabaseSchemaError,
  DuplicateRecordError,
  normalizeDatabaseError,
} from "../db/errors.js";

test("database errors are translated before leaving the database layer", () => {
  assert.ok(normalizeDatabaseError({ code: "ER_DUP_ENTRY" }) instanceof DuplicateRecordError);
  assert.ok(normalizeDatabaseError({ code: "ER_NO_SUCH_TABLE" }) instanceof DatabaseSchemaError);
  assert.ok(normalizeDatabaseError({ code: "ER_BAD_FIELD_ERROR" }) instanceof DatabaseSchemaError);
});

test("unknown database errors keep their original identity", () => {
  const error = new Error("connection lost");
  assert.equal(normalizeDatabaseError(error), error);
});
