import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn<(email: string, password: string) => Promise<string | null>>(),
  };

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

  it("should return an access token for valid credentials", async () => {
    mockAuthService.login.mockResolvedValue("Valid-JWT");

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

});
