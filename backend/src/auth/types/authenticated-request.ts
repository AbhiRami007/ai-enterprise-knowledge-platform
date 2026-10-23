import type { JwtPayload } from "./jwt-payload.js";

// The subset of the HTTP request the auth guards rely on.
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtPayload;
}
