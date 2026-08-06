export class DuplicateRecordError extends Error {
  constructor(cause) {
    super("A record with the same unique value already exists", { cause });
    this.name = "DuplicateRecordError";
  }
}

export class DatabaseSchemaError extends Error {
  constructor(cause) {
    super("The database schema does not match the application", { cause });
    this.name = "DatabaseSchemaError";
  }
}

export function normalizeDatabaseError(error) {
  if (error instanceof DuplicateRecordError || error instanceof DatabaseSchemaError) {
    return error;
  }
  if (error?.code === "ER_DUP_ENTRY") return new DuplicateRecordError(error);
  if (["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(error?.code)) {
    return new DatabaseSchemaError(error);
  }
  return error;
}
