import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { createHash } from "node:crypto";
import { TokensService } from "./tokens.service.js";
import { RefreshToken } from "./entities/refresh-token.entity.js";
import { User } from "../users/entities/user.entity.js";
import { Role } from "../users/enums/role.enum.js";
import type { Repository } from "typeorm";
import { UserStatus } from "../users/enums/user-status.enum.js";

const user = {
  id: "user-1",
  role: Role.Viewer,
  tenantId: "tenant-1",
  isActive: true,
  status: UserStatus.Active,
} as User;

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

describe("TokensService", () => {
  const jwtService = new JwtService({ secret: "test-secret" });
  let repository: {
    insert: jest.Mock<(row: Partial<RefreshToken>) => Promise<unknown>>;
    findOne: jest.Mock<() => Promise<RefreshToken | null>>;
    update: jest.Mock<
      (where: object, values: object) => Promise<{ affected?: number }>
    >;
  };
  let service: TokensService;

  beforeEach(() => {
    repository = {
      insert: jest.fn<(row: Partial<RefreshToken>) => Promise<unknown>>(),
      findOne: jest.fn<() => Promise<RefreshToken | null>>(),
      update: jest
        .fn<(where: object, values: object) => Promise<{ affected?: number }>>()
        .mockResolvedValue({ affected: 1 }),
    };
    service = new TokensService(
      repository as unknown as Repository<RefreshToken>,
      jwtService,
      new ConfigService({ REFRESH_TOKEN_TTL_DAYS: "7" })
    );
  });

  function storedToken(overrides: Partial<RefreshToken> = {}) {
    return {
      id: "token-1",
      userId: user.id,
      user,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      ...overrides,
    } as RefreshToken;
  }

  it("should issue a signed access token and store only the refresh token hash", async () => {
    const tokens = await service.issue(user);

    expect(jwtService.verify(tokens.accessToken)).toMatchObject({
      sub: "user-1",
      role: Role.Viewer,
      tenantId: "tenant-1",
    });

    const row = repository.insert.mock.calls[0][0];
    expect(row.tokenHash).toBe(sha256(tokens.refreshToken));
    expect(row.tokenHash).not.toBe(tokens.refreshToken);
    expect(row.expiresAt!.getTime()).toBeGreaterThan(
      Date.now() + 6 * 24 * 60 * 60 * 1000
    );
  });

  it("should rotate a valid refresh token into a new pair", async () => {
    repository.findOne.mockResolvedValue(storedToken());

    const tokens = await service.rotate("old-token");

    expect(tokens?.refreshToken).toBeDefined();
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.insert).toHaveBeenCalledTimes(1);
  });

  it("should return null for an unknown refresh token", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.rotate("unknown")).resolves.toBeNull();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("should revoke every session when a used token is replayed", async () => {
    repository.findOne.mockResolvedValue(storedToken({ revokedAt: new Date() }));
    repository.update.mockResolvedValueOnce({ affected: 0 });

    await expect(service.rotate("replayed")).resolves.toBeNull();
    expect(repository.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      expect.objectContaining({ revokedAt: expect.any(Date) })
    );
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("should reject an expired refresh token", async () => {
    repository.findOne.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(service.rotate("expired")).resolves.toBeNull();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("should reject a refresh token for an inactive user", async () => {
    repository.findOne.mockResolvedValue(
      storedToken({ user: { ...user, isActive: false } as User })
    );

    await expect(service.rotate("inactive")).resolves.toBeNull();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("should reject a refresh token for a user who isn't approved", async () => {
    repository.findOne.mockResolvedValue(
      storedToken({ user: { ...user, status: UserStatus.Rejected } as User })
    );

    await expect(service.rotate("rejected")).resolves.toBeNull();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("should revoke a token by its hash", async () => {
    await service.revoke("some-token");

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: sha256("some-token") }),
      expect.objectContaining({ revokedAt: expect.any(Date) })
    );
  });
});
