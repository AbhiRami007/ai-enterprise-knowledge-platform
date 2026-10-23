import { ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, beforeEach, afterEach, it, expect, jest } from "@jest/globals";
import { RateLimitGuard } from "./rate-limit.guard.js";

class TestController {
  login() {}
}

function contextFor(ip: string, headers: Record<string, string> = {}) {
  return {
    getHandler: () => TestController.prototype.login,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
      getResponse: () => ({
        setHeader: (name: string, value: string) => (headers[name] = value),
      }),
    }),
  } as unknown as ExecutionContext;
}

describe("RateLimitGuard", () => {
  let reflector: Reflector;
  let guard: RateLimitGuard;

  beforeEach(() => {
    jest.useFakeTimers();
    reflector = new Reflector();
    reflector.get = (() => ({ limit: 2, windowMs: 60_000 })) as Reflector["get"];
    guard = new RateLimitGuard(reflector);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow routes without @RateLimit()", () => {
    reflector.get = (() => undefined) as Reflector["get"];

    for (let i = 0; i < 10; i++) {
      expect(guard.canActivate(contextFor("1.1.1.1"))).toBe(true);
    }
  });

  it("should reject requests over the limit with 429 and Retry-After", () => {
    const headers: Record<string, string> = {};

    guard.canActivate(contextFor("1.1.1.1"));
    guard.canActivate(contextFor("1.1.1.1"));

    let error: HttpException | undefined;
    try {
      guard.canActivate(contextFor("1.1.1.1", headers));
    } catch (e) {
      error = e as HttpException;
    }

    expect(error?.getStatus()).toBe(429);
    expect(headers["Retry-After"]).toBe("60");
  });

  it("should count each IP separately", () => {
    guard.canActivate(contextFor("1.1.1.1"));
    guard.canActivate(contextFor("1.1.1.1"));

    expect(guard.canActivate(contextFor("2.2.2.2"))).toBe(true);
  });

  it("should allow requests again once the window has passed", () => {
    guard.canActivate(contextFor("1.1.1.1"));
    guard.canActivate(contextFor("1.1.1.1"));

    jest.advanceTimersByTime(60_000);

    expect(guard.canActivate(contextFor("1.1.1.1"))).toBe(true);
  });
});
