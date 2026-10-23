import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, beforeEach, it, expect } from "@jest/globals";
import { RolesGuard } from "./roles.guard.js";
import { Role } from "../../users/enums/role.enum.js";
import type { AuthenticatedRequest } from "../types/authenticated-request.js";

function contextFor(request: AuthenticatedRequest) {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const requestAs = (role: Role): AuthenticatedRequest => ({
  headers: {},
  user: { sub: "user-1", role, tenantId: "tenant-1" },
});

describe("RolesGuard", () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("should allow routes without @Roles()", () => {
    reflector.getAllAndOverride = () => undefined;

    expect(guard.canActivate(contextFor(requestAs(Role.Viewer)))).toBe(true);
  });

  it("should allow a user with a required role", () => {
    reflector.getAllAndOverride = () => [Role.Admin];

    expect(guard.canActivate(contextFor(requestAs(Role.Admin)))).toBe(true);
  });

  it("should forbid a user without a required role", () => {
    reflector.getAllAndOverride = () => [Role.Admin];

    expect(() => guard.canActivate(contextFor(requestAs(Role.Viewer)))).toThrow(
      ForbiddenException
    );
  });

  it("should forbid when no user is attached", () => {
    reflector.getAllAndOverride = () => [Role.Admin];

    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(
      ForbiddenException
    );
  });
});
