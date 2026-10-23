import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Role } from "../users/enums/role.enum.js";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn<(email: string, password: string) => Promise<object | null>>(),
    refresh: jest.fn<(refreshToken: string) => Promise<object | null>>(),
    logout: jest.fn<(refreshToken: string) => Promise<void>>(),
    logoutAll: jest.fn<(userId: string) => Promise<void>>(),
    getProfile: jest.fn<(userId: string) => Promise<object>>(),
  };

  const user = { sub: "user-1", role: Role.Viewer, tenantId: "tenant-1" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should return tokens for valid credentials", async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: "Valid-JWT" });

    const result = await controller.login({
      email: "user@example.com",
      password: "Password123!",
    });

    expect(result).toEqual({ accessToken: "Valid-JWT" });
  });

  it("should throw Unauthorized for invalid credentials", async () => {
    mockAuthService.login.mockResolvedValue(null);

    await expect(
      controller.login({
        email: "user@example.com",
        password: "WrongPassword!",
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should return the profile of the logged-in user", async () => {
    mockAuthService.getProfile.mockResolvedValue({ id: "user-1" });

    const result = await controller.me(user);

    expect(result).toEqual({ id: "user-1" });
    expect(mockAuthService.getProfile).toHaveBeenCalledWith("user-1");
  });

  it("should return new tokens for a valid refresh token", async () => {
    mockAuthService.refresh.mockResolvedValue({ accessToken: "New-JWT" });

    const result = await controller.refresh({ refreshToken: "refresh-token" });

    expect(result).toEqual({ accessToken: "New-JWT" });
  });

  it("should throw Unauthorized for an unusable refresh token", async () => {
    mockAuthService.refresh.mockResolvedValue(null);

    await expect(
      controller.refresh({ refreshToken: "used-token" })
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should revoke the refresh token on logout", async () => {
    await controller.logout({ refreshToken: "refresh-token" });

    expect(mockAuthService.logout).toHaveBeenCalledWith("refresh-token");
  });

  it("should revoke every session for the current user", async () => {
    await controller.logoutAll(user);

    expect(mockAuthService.logoutAll).toHaveBeenCalledWith("user-1");
  });
});
