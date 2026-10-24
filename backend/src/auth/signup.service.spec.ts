import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as bcrypt from "bcryptjs";
import type { DataSource, EntityManager } from "typeorm";
import { Tenant } from "../tenants/entities/tenant.entity.js";
import type { TenantRepository } from "../tenants/tenant.repository.js";
import { User } from "../users/entities/user.entity.js";
import { Role } from "../users/enums/role.enum.js";
import { UserStatus } from "../users/enums/user-status.enum.js";
import type { UserRepository } from "../users/user.repository.js";
import { SignupService } from "./signup.service.js";
import type { TokensService } from "./tokens.service.js";

describe("SignupService", () => {
  const acme = { id: "tenant-1", name: "Acme Corp", createdAt: new Date() };
  const tokens = {
    accessToken: "jwt",
    refreshToken: "refresh",
    tokenType: "Bearer" as const,
    expiresIn: 900,
    refreshTokenExpiresAt: new Date(),
  };

  let tenants: {
    findById: jest.Mock<(id: string) => Promise<Tenant | null>>;
    findByName: jest.Mock<(name: string) => Promise<Tenant | null>>;
  };
  let users: {
    findByEmail: jest.Mock<(email: string) => Promise<User | null>>;
    create: jest.Mock<(data: Partial<User>) => Promise<User>>;
  };
  let tokensService: { issue: jest.Mock<(user: User) => Promise<typeof tokens>> };
  // Records what the transaction saved, in order.
  let saved: object[];
  let failUserInsert: boolean;
  let service: SignupService;

  beforeEach(() => {
    tenants = {
      findById: jest.fn<(id: string) => Promise<Tenant | null>>(),
      findByName: jest
        .fn<(name: string) => Promise<Tenant | null>>()
        .mockResolvedValue(null),
    };
    users = {
      findByEmail: jest
        .fn<(email: string) => Promise<User | null>>()
        .mockResolvedValue(null),
      create: jest
        .fn<(data: Partial<User>) => Promise<User>>()
        .mockImplementation(async (data) => ({ id: "user-9", ...data }) as User),
    };
    tokensService = {
      issue: jest.fn<(user: User) => Promise<typeof tokens>>().mockResolvedValue(tokens),
    };
    saved = [];
    failUserInsert = false;

    // A fake transaction: saves are recorded, and nothing counts as written
    // unless the callback finishes (like a real rollback).
    const dataSource = {
      transaction: async (work: (manager: EntityManager) => Promise<unknown>) => {
        const pending: object[] = [];
        const manager = {
          create: (_entity: unknown, data: object) => ({ ...data }),
          save: async (entity: { tenantId?: string }) => {
            if (entity.tenantId && failUserInsert) {
              throw new Error("insert failed");
            }
            const row = { id: entity.tenantId ? "user-9" : "tenant-9", ...entity };
            pending.push(row);
            return row;
          },
        } as unknown as EntityManager;
        const result = await work(manager);
        saved.push(...pending);
        return result;
      },
    } as unknown as DataSource;

    service = new SignupService(
      dataSource,
      tenants as unknown as TenantRepository,
      users as unknown as UserRepository,
      tokensService as unknown as TokensService
    );
  });

  describe("joining an existing company", () => {
    it("should create a pending viewer and issue no tokens", async () => {
      tenants.findById.mockResolvedValue(acme);

      const result = await service.signup({
        tenantId: "tenant-1",
        email: "new@acme.test",
        password: "a-longer-passphrase",
      });

      expect(result).toEqual({
        kind: "pending",
        tenant: { id: "tenant-1", name: "Acme Corp" },
      });
      const data = users.create.mock.calls[0][0];
      expect(data).toMatchObject({
        tenantId: "tenant-1",
        role: Role.Viewer,
        status: UserStatus.Pending,
      });
      expect(await bcrypt.compare("a-longer-passphrase", data.passwordHash!)).toBe(
        true
      );
      expect(tokensService.issue).not.toHaveBeenCalled();
    });

    it("should 404 for a company that doesn't exist", async () => {
      tenants.findById.mockResolvedValue(null);

      await expect(
        service.signup({
          tenantId: "tenant-x",
          email: "new@acme.test",
          password: "a-longer-passphrase",
        })
      ).rejects.toThrow(NotFoundException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe("creating a new company", () => {
    it("should create the company with the user as an active admin and log them in", async () => {
      const result = await service.signup({
        companyName: "Initech",
        email: "founder@initech.test",
        password: "a-longer-passphrase",
      });

      expect(saved).toEqual([
        expect.objectContaining({ name: "Initech" }),
        expect.objectContaining({
          email: "founder@initech.test",
          role: Role.Admin,
          status: UserStatus.Active,
          tenantId: "tenant-9",
        }),
      ]);
      expect(result).toMatchObject({
        kind: "created",
        tenant: { id: "tenant-9", name: "Initech" },
        tokens,
      });
    });

    it("should reject a name that already exists, ignoring case", async () => {
      tenants.findByName.mockResolvedValue(acme);

      await expect(
        service.signup({
          companyName: "acme corp",
          email: "someone@else.test",
          password: "a-longer-passphrase",
        })
      ).rejects.toThrow(ConflictException);
      expect(saved).toEqual([]);
    });

    it("should leave no company behind when creating the user fails", async () => {
      failUserInsert = true;

      await expect(
        service.signup({
          companyName: "Initech",
          email: "founder@initech.test",
          password: "a-longer-passphrase",
        })
      ).rejects.toThrow("insert failed");
      expect(saved).toEqual([]);
      expect(tokensService.issue).not.toHaveBeenCalled();
    });
  });

  it("should reject an email that is already registered", async () => {
    users.findByEmail.mockResolvedValue({ id: "user-1" } as User);

    await expect(
      service.signup({
        companyName: "Initech",
        email: "taken@example.com",
        password: "a-longer-passphrase",
      })
    ).rejects.toThrow(ConflictException);
    expect(saved).toEqual([]);
  });

  it("should reject a body with both tenantId and companyName", async () => {
    await expect(
      service.signup({
        tenantId: "tenant-1",
        companyName: "Initech",
        email: "x@example.com",
        password: "a-longer-passphrase",
      })
    ).rejects.toThrow(BadRequestException);
  });
});
