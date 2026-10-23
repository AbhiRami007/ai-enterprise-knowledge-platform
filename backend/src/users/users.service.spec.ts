import { ConflictException } from "@nestjs/common";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import * as bcrypt from "bcryptjs";
import { QueryFailedError } from "typeorm";
import { UsersService } from "./users.service.js";
import { UserRepository } from "./user.repository.js";
import { Role } from "./enums/role.enum.js";
import { User } from "./entities/user.entity.js";

describe("UsersService", () => {
  let repository: {
    findByEmail: jest.Mock<(email: string) => Promise<User | null>>;
    create: jest.Mock<(data: Partial<User>) => Promise<User>>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
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
});
