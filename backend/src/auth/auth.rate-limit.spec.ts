import { INestApplication, ValidationPipe } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { describe, beforeAll, afterAll, it, expect, jest } from "@jest/globals";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { RateLimitGuard } from "./guards/rate-limit.guard.js";

// Runs the real HTTP pipeline so the @RateLimit() limits are exercised end to end.
describe("AuthController rate limiting", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn<() => Promise<null>>().mockResolvedValue(null) },
        },
        { provide: APP_GUARD, useClass: RateLimitGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 429 after 5 login attempts in a minute", async () => {
    const attempt = () =>
      fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "WrongPassword!",
        }),
      }).then((response) => response.status);

    const statuses = [];
    for (let i = 0; i < 6; i++) {
      statuses.push(await attempt());
    }

    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });
});
