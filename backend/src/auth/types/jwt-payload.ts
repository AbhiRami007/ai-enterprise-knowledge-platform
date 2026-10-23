import type { Role } from "../../users/enums/role.enum.js";

// Claims carried by an access token.
export interface JwtPayload {
  sub: string;
  role: Role;
  tenantId: string;
}
