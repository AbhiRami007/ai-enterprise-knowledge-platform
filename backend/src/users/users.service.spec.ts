import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import * as bcrypt from "bcryptjs";
import { QueryFailedError } from "typeorm";
import { UsersService } from "./users.service.js";
import { UserRepository } from "./user.repository.js";
import { Role } from "./enums/role.enum.js";
import { User } from "./entities/user.entity.js";
import { UserStatus } from "./enums/user-status.enum.js";

describe("UsersService", () => {
  let repository: {
    findByEmail: jest.Mock<(email: string) => Promise<User | null>>;
    findAllByTenant: jest.Mock<(tenantId: string) => Promise<User[]>>;
    findByIdInTenant: jest.Mock<(id: string, tenantId: string) => Promise<User | null>>;
    findById: jest.Mock<(id: string) => Promise<User | null>>;
    updateStatus: jest.Mock<(id: string, fields: Partial<User>) => Promise<void>>;
    countActiveAdmins: jest.Mock<(tenantId: string) => Promise<number>>;
    delete: jest.Mock<(id: string) => Promise<void>>;
    create: jest.Mock<(data: Partial<User>) => Promise<User>>;
  };
  let service: UsersService;

  beforeEach(() => {
    // A tiny in-memory "table" so approve/reject can be checked end to end.
    const rows = new Map<string, User>();
    repository = {
      findByIdInTenant: jest
        .fn<(id: string, tenantId: string) => Promise<User | null>>()
        .mockImplementation(async (id, tenantId) => {
          const row = rows.get(id);
          return row && row.tenantId === tenantId ? row : null;
        }),
      findById: jest
        .fn<(id: string) => Promise<User | null>>()
        .mockImplementation(async (id) => rows.get(id) ?? null),
      updateStatus: jest
        .fn<(id: string, fields: Partial<User>) => Promise<void>>()
        .mockImplementation(async (id, fields) => {
          Object.assign(rows.get(id)!, fields);
        }),
      countActiveAdmins: jest
        .fn<(tenantId: string) => Promise<number>>()
        .mockImplementation(async (tenantId) =>
          [...rows.values()].filter(
            (u) =>
              u.tenantId === tenantId &&
              u.role === Role.Admin &&
              u.status === UserStatus.Active
          ).length
        ),
      delete: jest
        .fn<(id: string) => Promise<void>>()
        .mockImplementation(async (id) => {
          rows.delete(id);
        }),
      findAllByTenant: jest
        .fn<(tenantId: string) => Promise<User[]>>()
        .mockResolvedValue([]),
      findByEmail: jest
        .fn<(email: string) => Promise<User | null>>()
        .mockResolvedValue(null),
      create: jest
        .fn<(data: Partial<User>) => Promise<User>>()
        .mockImplementation(async (data) =>
          ({
            id: "user-2",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }) as User
        ),
    };
    service = new UsersService(repository as unknown as UserRepository);

    const request = (id: string, tenantId: string, status: UserStatus) =>
      rows.set(id, {
        id,
        email: `${id}@example.com`,
        passwordHash: "$2b$10$hash",
        role: Role.Viewer,
        tenantId,
        isActive: true,
        status,
        rejectedAt: status === UserStatus.Rejected ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
    request("pending-acme", "tenant-1", UserStatus.Pending);
    request("rejected-acme", "tenant-1", UserStatus.Rejected);
    request("active-acme", "tenant-1", UserStatus.Active);
    request("pending-globex", "tenant-2", UserStatus.Pending);
    request("admin-acme", "tenant-1", UserStatus.Active);
    rows.get("admin-acme")!.role = Role.Admin;
  });

  it("should create a viewer in the given tenant with a hashed password", async () => {
    const result = await service.create("tenant-1", {
      email: "new@example.com",
      password: "a-longer-passphrase",
    });

    const data = repository.create.mock.calls[0][0];
    expect(data.tenantId).toBe("tenant-1");
    expect(data.role).toBe(Role.Viewer);
    expect(await bcrypt.compare("a-longer-passphrase", data.passwordHash!)).toBe(
      true
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("should reject an email that already exists", async () => {
    repository.findByEmail.mockResolvedValue({ id: "user-1" } as User);

    await expect(
      service.create("tenant-1", {
        email: "taken@example.com",
        password: "a-longer-passphrase",
      })
    ).rejects.toThrow(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("should map a unique-constraint race to Conflict", async () => {
    repository.create.mockRejectedValue(
      new QueryFailedError("INSERT", [], Object.assign(new Error(), { code: "23505" }))
    );

    await expect(
      service.create("tenant-1", {
        email: "race@example.com",
        password: "a-longer-passphrase",
      })
    ).rejects.toThrow(ConflictException);
  });

  it("should list the tenant's users without password hashes", async () => {
    repository.findAllByTenant.mockResolvedValue([
      {
        id: "user-1",
        email: "a@example.com",
        passwordHash: "$2b$10$hash",
        role: Role.Admin,
        tenantId: "tenant-1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User,
    ]);

    const result = await service.findAllInTenant("tenant-1");

    expect(repository.findAllByTenant).toHaveBeenCalledWith("tenant-1");
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("passwordHash");
    expect(result[0].email).toBe("a@example.com");
  });

  describe("join requests", () => {
    it("should approve a pending request with the chosen role", async () => {
      const result = await service.approve("tenant-1", "pending-acme", Role.Editor);

      expect(result).toMatchObject({
        status: UserStatus.Active,
        role: Role.Editor,
        rejectedAt: null,
      });
    });

    it("should approve a previously rejected request", async () => {
      const result = await service.approve("tenant-1", "rejected-acme");

      expect(result).toMatchObject({
        status: UserStatus.Active,
        role: Role.Viewer,
        rejectedAt: null,
      });
    });

    it("should reject a pending request and keep it", async () => {
      const result = await service.reject("tenant-1", "pending-acme");

      expect(result.status).toBe(UserStatus.Rejected);
      expect(result.rejectedAt).toBeInstanceOf(Date);
    });

    it("should 404 for another company's request", async () => {
      await expect(
        service.approve("tenant-1", "pending-globex")
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reject("tenant-1", "pending-globex")
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it("should 404 when the user isn't in a state the action applies to", async () => {
      await expect(service.approve("tenant-1", "active-acme")).rejects.toThrow(
        NotFoundException
      );
      await expect(service.reject("tenant-1", "rejected-acme")).rejects.toThrow(
        NotFoundException
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a member of the admin's company", async () => {
      await service.delete("tenant-1", "admin-acme", "active-acme");

      expect(repository.delete).toHaveBeenCalledWith("active-acme");
      expect(await repository.findById("active-acme")).toBeNull();
    });

    it("should delete a rejected request, so the email can sign up again", async () => {
      await service.delete("tenant-1", "admin-acme", "rejected-acme");

      expect(repository.delete).toHaveBeenCalledWith("rejected-acme");
    });

    it("should 404 for another company's user", async () => {
      await expect(
        service.delete("tenant-1", "admin-acme", "pending-globex")
      ).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it("should refuse to let an admin delete themselves", async () => {
      await expect(
        service.delete("tenant-1", "admin-acme", "admin-acme")
      ).rejects.toThrow(ConflictException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it("should refuse to delete the company's last admin", async () => {
      // e.g. a caller whose token still says admin after losing the role
      await expect(
        service.delete("tenant-1", "someone-else", "admin-acme")
      ).rejects.toThrow(/last admin/);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
