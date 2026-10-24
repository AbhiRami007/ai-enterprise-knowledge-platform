import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import type { Request, Response } from "express";
import { Role } from "../users/enums/role.enum.js";
import { REFRESH_TOKEN_COOKIE } from "./refresh-token.cookie.js";
import { SignupService } from "./signup.service.js";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = {
    login:
      jest.fn<(email: string, password: string) => Promise<object | null>>(),
    refresh: jest.fn<(refreshToken: string) => Promise<object | null>>(),
    logout: jest.fn<(refreshToken: string) => Promise<void>>(),
    logoutAll: jest.fn<(userId: string) => Promise<void>>(),
    changePassword:
      jest.fn<
        (userId: string, current: string, next: string) => Promise<object>
      >(),
    getProfile: jest.fn<(userId: string) => Promise<object>>(),
  };

  const mockSignupService = {
    signup: jest.fn<(dto: object) => Promise<object>>(),
  };

  const user = { sub: "user-1", role: Role.Viewer, tenantId: "tenant-1" };

  const tokens = {
    accessToken: "Valid-JWT",
    refreshToken: "new-refresh-token",
    tokenType: "Bearer",
    expiresIn: 900,
    refreshTokenExpiresAt: new Date("2026-11-01T00:00:00Z"),
  };
  const body = {
    accessToken: "Valid-JWT",
    tokenType: "Bearer",
    expiresIn: 900,
  };

  let res: { cookie: jest.Mock; clearCookie: jest.Mock; status: jest.Mock };

  const reqWithCookie = (token?: string) =>
    ({ cookies: token ? { [REFRESH_TOKEN_COOKIE]: token } : {} } as Request);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        { provide: SignupService, useValue: mockSignupService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    res = { cookie: jest.fn(), clearCookie: jest.fn(), status: jest.fn() };
  });

  it("should return the access token and set the refresh cookie on login", async () => {
    mockAuthService.login.mockResolvedValue(tokens);

    const result = await controller.login(
      { email: "user@example.com", password: "Password123!" },
      res as unknown as Response
    );

    expect(result).toEqual(body);
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "new-refresh-token",
      expect.objectContaining({
        httpOnly: true,
        expires: tokens.refreshTokenExpiresAt,
      })
    );
  });

  it("should throw Unauthorized for invalid credentials", async () => {
    mockAuthService.login.mockResolvedValue(null);

    await expect(
      controller.login(
        { email: "user@example.com", password: "WrongPassword!" },
        res as unknown as Response
      )
    ).rejects.toThrow(UnauthorizedException);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("should return the profile of the logged-in user", async () => {
    mockAuthService.getProfile.mockResolvedValue({ id: "user-1" });

    const result = await controller.me(user);

    expect(result).toEqual({ id: "user-1" });
    expect(mockAuthService.getProfile).toHaveBeenCalledWith("user-1");
  });

  it("should rotate the refresh cookie for a valid refresh token", async () => {
    mockAuthService.refresh.mockResolvedValue(tokens);

    const result = await controller.refresh(
      reqWithCookie("refresh-token"),
      res as unknown as Response
    );

    expect(mockAuthService.refresh).toHaveBeenCalledWith("refresh-token");
    expect(result).toEqual(body);
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "new-refresh-token",
      expect.anything()
    );
  });

  it("should throw Unauthorized for an unusable refresh token", async () => {
    mockAuthService.refresh.mockResolvedValue(null);

    await expect(
      controller.refresh(
        reqWithCookie("used-token"),
        res as unknown as Response
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should throw Unauthorized when the refresh cookie is missing", async () => {
    mockAuthService.refresh.mockClear();

    await expect(
      controller.refresh(reqWithCookie(), res as unknown as Response)
    ).rejects.toThrow(UnauthorizedException);
    expect(mockAuthService.refresh).not.toHaveBeenCalled();
  });

  it("should revoke the refresh token and clear the cookie on logout", async () => {
    await controller.logout(
      reqWithCookie("refresh-token"),
      res as unknown as Response
    );

    expect(mockAuthService.logout).toHaveBeenCalledWith("refresh-token");
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ path: "/api/v1/auth" })
    );
  });

  it("should still clear the cookie on logout without a refresh cookie", async () => {
    mockAuthService.logout.mockClear();

    await controller.logout(reqWithCookie(), res as unknown as Response);

    expect(mockAuthService.logout).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it("should revoke every session for the current user", async () => {
    await controller.logoutAll(user, res as unknown as Response);

    expect(mockAuthService.logoutAll).toHaveBeenCalledWith("user-1");
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.anything()
    );
  });

  it("should change the password of the current user", async () => {
    mockAuthService.changePassword.mockResolvedValue(tokens);

    const result = await controller.changePassword(
      user,
      { currentPassword: "Password123!", newPassword: "a-longer-passphrase" },
      res as unknown as Response
    );

    expect(result).toEqual(body);
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "new-refresh-token",
      expect.anything()
    );
    expect(mockAuthService.changePassword).toHaveBeenCalledWith(
      "user-1",
      "Password123!",
      "a-longer-passphrase"
    );
  });

  it("should log in the founder of a new company on signup", async () => {
    mockSignupService.signup.mockResolvedValue({
      kind: "created",
      tenant: { id: "tenant-2", name: "Initech" },
      tokens,
    });

    const result = await controller.signup(
      {
        companyName: "Initech",
        email: "founder@initech.test",
        password: "a-longer-passphrase",
      },
      res as unknown as Response
    );

    expect(result).toEqual(body);
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "new-refresh-token",
      expect.anything()
    );
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should answer 202 without tokens for a join request", async () => {
    mockSignupService.signup.mockResolvedValue({
      kind: "pending",
      tenant: { id: "tenant-1", name: "Acme Corp" },
    });

    const result = await controller.signup(
      {
        tenantId: "tenant-1",
        email: "new@acme.test",
        password: "a-longer-passphrase",
      },
      res as unknown as Response
    );

    expect(res.status).toHaveBeenCalledWith(202);
    expect(result).toEqual({
      status: "pending",
      tenant: { id: "tenant-1", name: "Acme Corp" },
    });
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
