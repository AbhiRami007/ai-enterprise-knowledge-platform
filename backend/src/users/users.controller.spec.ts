import { Test, TestingModule } from "@nestjs/testing";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";
import { Role } from "./enums/role.enum.js";

describe("UsersController", () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn<(tenantId: string, dto: object) => Promise<object>>(),
    findAllInTenant: jest.fn<(tenantId: string) => Promise<object[]>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should create the user in the admin's tenant", async () => {
    mockUsersService.create.mockResolvedValue({ id: "user-2" });
    const body = { email: "new@example.com", password: "a-longer-passphrase" };

    const result = await controller.create(
      { sub: "admin-1", role: Role.Admin, tenantId: "tenant-1" },
      body
    );

    expect(result).toEqual({ id: "user-2" });
    expect(mockUsersService.create).toHaveBeenCalledWith("tenant-1", body);
  });

  it("should list only the users of the admin's own tenant", async () => {
    mockUsersService.findAllInTenant.mockResolvedValue([{ id: "user-2" }]);

    const result = await controller.findAll({
      sub: "admin-1",
      role: Role.Admin,
      tenantId: "tenant-1",
    });

    expect(result).toEqual([{ id: "user-2" }]);
    expect(mockUsersService.findAllInTenant).toHaveBeenCalledWith("tenant-1");
  });
});
