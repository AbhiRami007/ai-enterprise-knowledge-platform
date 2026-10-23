import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import { Role } from "../users/enums/role.enum.js";
import { UserRepository } from "../users/user.repository.js";
import { JwtService } from "@nestjs/jwt";

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
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const mockJwt = "Valid-JWT";

  const mockUserRepository = {
    findByEmail:
      jest.fn<(email: string) => Promise<typeof mockResolvedData | null>>(),
    findById:
      jest.fn<(id: string) => Promise<typeof mockResolvedData | null>>(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue(mockJwt),
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
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should return a JWT for valid credentials", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockResolvedData);

    const result = await service.login("user@example.com", "Password123!");

    expect(result).toBe(mockJwt);
  });

  it("should not return a JWT for invalid credentials", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await service.login("user@example.com", "Password123!");

    expect(result).toBe(null);
  });

  it("should reject invalid passwords", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockResolvedData);

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

  it("should return the profile without the password hash", async () => {
    mockUserRepository.findById.mockResolvedValue(mockResolvedData);

    const profile = await service.getProfile("user-1");

    expect(profile).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: Role.Viewer,
      tenantId: "tenant-1",
      isActive: true,
      createdAt: mockResolvedData.createdAt,
    });
  });

  it("should reject a profile request for a missing user", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(service.getProfile("user-1")).rejects.toThrow(
      UnauthorizedException
    );
  });
});
