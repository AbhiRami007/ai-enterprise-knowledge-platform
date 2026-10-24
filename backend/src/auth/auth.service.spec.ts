import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Role } from "../users/enums/role.enum.js";
import { UserRepository } from "../users/user.repository.js";
import { TokensService } from "./tokens.service.js";
import { UserStatus } from "../users/enums/user-status.enum.js";

describe("AuthService", () => {
  let service: AuthService;

  const mockResolvedData = {
    id: "user-1",
    email: "user@example.com",
    passwordHash:
      "$2b$10$W7DTvZWql1xSPSj0NP37Ge8DaMY.aJowV2/7dZ5i3W5snny2pg0KO",
    role: Role.Viewer,
    tenantId: "tenant-1",
    isActive: true,
    status: UserStatus.Active,
    rejectedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const mockTokens = {
    accessToken: "Valid-JWT",
    refreshToken: "refresh-token",
    tokenType: "Bearer" as const,
    expiresIn: 900,
  };

  const mockUserRepository = {
    findByEmail:
      jest.fn<(email: string) => Promise<typeof mockResolvedData | null>>(),
    findById:
      jest.fn<(id: string) => Promise<typeof mockResolvedData | null>>(),
    findByIdWithTenant:
      jest.fn<(id: string) => Promise<object | null>>(),
    updatePasswordHash:
      jest.fn<(id: string, passwordHash: string) => Promise<void>>(),
  };

  const mockTokensService = {
    issue: jest.fn<() => Promise<typeof mockTokens>>(),
    rotate: jest.fn<() => Promise<typeof mockTokens | null>>(),
    revoke: jest.fn<() => Promise<void>>(),
    revokeAllForUser: jest.fn<() => Promise<void>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should issue tokens for valid credentials", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockResolvedData);
    mockTokensService.issue.mockResolvedValue(mockTokens);

    const result = await service.login("user@example.com", "Password123!");

    expect(result).toBe(mockTokens);
  });

  it("should not issue tokens for an unknown email", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await service.login("user@example.com", "Password123!");

    expect(result).toBe(null);
  });

  it("should reject invalid passwords", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockResolvedData);

    const result = await service.login("user@example.com", "WrongPassword!");

    expect(result).toBe(null);
  });

  it.each([
    [UserStatus.Pending, "ACCOUNT_PENDING"],
    [UserStatus.Rejected, "ACCOUNT_REJECTED"],
  ])(
    "should refuse a %s user with a 403 and code %s after a correct password",
    async (status, code) => {
      mockUserRepository.findByEmail.mockResolvedValue({
        ...mockResolvedData,
        status,
      });
      mockTokensService.issue.mockClear();

      await expect(
        service.login("user@example.com", "Password123!")
      ).rejects.toMatchObject({
        status: 403,
        response: expect.objectContaining({ code }),
      });
      expect(mockTokensService.issue).not.toHaveBeenCalled();
    }
  );

  it("should not reveal a pending account to someone with the wrong password", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...mockResolvedData,
      status: UserStatus.Pending,
    });

    const result = await service.login("user@example.com", "WrongPassword!");

    expect(result).toBe(null);
  });

  it("should reject inactive users", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...mockResolvedData,
      isActive: false,
    });

    const result = await service.login("user@example.com", "Password123!");

    expect(result).toBe(null);
  });

  it("should return the profile with the tenant and without the password hash", async () => {
    mockUserRepository.findByIdWithTenant.mockResolvedValue({
      ...mockResolvedData,
      tenant: { id: "tenant-1", name: "Acme Corp", createdAt: new Date() },
    });

    const profile = await service.getProfile("user-1");

    expect(profile).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: Role.Viewer,
      tenantId: "tenant-1",
      isActive: true,
      status: UserStatus.Active,
      rejectedAt: null,
      createdAt: mockResolvedData.createdAt,
      tenant: { id: "tenant-1", name: "Acme Corp" },
    });
  });

  it("should reject a profile request for a missing user", async () => {
    mockUserRepository.findByIdWithTenant.mockResolvedValue(null);

    await expect(service.getProfile("user-1")).rejects.toThrow(
      UnauthorizedException
    );
  });

  describe("changePassword", () => {
    beforeEach(() => {
      mockUserRepository.findById.mockResolvedValue(mockResolvedData);
      mockUserRepository.updatePasswordHash.mockClear();
      mockTokensService.revokeAllForUser.mockClear();
      mockTokensService.issue.mockResolvedValue(mockTokens);
    });

    it("should store a new hash, end other sessions and return new tokens", async () => {
      const result = await service.changePassword(
        "user-1",
        "Password123!",
        "a-longer-passphrase"
      );

      const [, newHash] = mockUserRepository.updatePasswordHash.mock.calls[0];
      expect(await bcrypt.compare("a-longer-passphrase", newHash)).toBe(true);
      expect(mockTokensService.revokeAllForUser).toHaveBeenCalledWith("user-1");
      expect(result).toBe(mockTokens);
    });

    it("should reject an incorrect current password", async () => {
      await expect(
        service.changePassword("user-1", "WrongPassword!", "a-longer-passphrase")
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled();
    });

    it("should reject reusing the current password", async () => {
      await expect(
        service.changePassword("user-1", "Password123!", "Password123!")
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled();
    });
  });
});
