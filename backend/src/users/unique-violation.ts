import { QueryFailedError } from "typeorm";

const UNIQUE_VIOLATION = "23505";

// True when Postgres rejected an insert because of a UNIQUE constraint,
// e.g. two requests creating the same email at the same moment.
export function isUniqueViolation(error: unknown) {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
  );
}
