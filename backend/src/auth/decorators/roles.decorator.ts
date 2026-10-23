import { SetMetadata } from "@nestjs/common";
import type { Role } from "../../users/enums/role.enum.js";

export const ROLES_KEY = "roles";

// Restricts a route or controller to users holding one of these roles.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
