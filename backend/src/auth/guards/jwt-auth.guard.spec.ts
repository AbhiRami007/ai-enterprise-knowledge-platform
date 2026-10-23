import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { describe, beforeEach, it, expect } from "@jest/globals";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { AuthenticatedRequest } from "../types/authenticated-request.js";

const jwtService = new JwtService({ secret: "test-secret" });

function contextFor(request: AuthenticatedRequest) {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(jwtService, reflector);
  });

  it("should allow public routes without a token", async () => {
    reflector.getAllAndOverride = () => true;

    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(
      true
    );
  });

  it("should attach the claims for a valid token", async () => {
    const token = jwtService.sign({
      sub: "user-1",
      role: "viewer",
      tenantId: "tenant-1",
    });
    const request: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: "user-1", tenantId: "tenant-1" });
  });

  it("should reject a missing Authorization header", async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} }))
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should reject a non-Bearer scheme", async () => {
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: "Basic dXNlcjpwYXNz" } })
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should reject a token signed with another secret", async () => {
    const token = new JwtService({ secret: "other" }).sign({ sub: "user-1" });

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: `Bearer ${token}` } })
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should reject an expired token", async () => {
    const token = jwtService.sign({ sub: "user-1" }, { expiresIn: -10 });

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: `Bearer ${token}` } })
      )
    ).rejects.toThrow(UnauthorizedException);
  });
});
