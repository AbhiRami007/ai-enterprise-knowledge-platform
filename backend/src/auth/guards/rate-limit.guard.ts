import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from "../decorators/rate-limit.decorator.js";

interface Window {
  count: number;
  resetAt: number;
}

// Beyond this many tracked clients, expired windows are swept on the next request.
const SWEEP_THRESHOLD = 10_000;

// Fixed-window, per-IP limiter for routes marked @RateLimit().
// Counts live in process memory, so each instance limits independently. Move to Redis when scaling out.
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, Window>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );

    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{ ip?: string }>();
    const key = `${context.getClass().name}.${context.getHandler().name}:${request.ip ?? "unknown"}`;
    const now = Date.now();

    if (this.windows.size > SWEEP_THRESHOLD) {
      this.sweep(now);
    }

    let window = this.windows.get(key);

    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + options.windowMs };
      this.windows.set(key, window);
    }

    window.count += 1;

    if (window.count > options.limit) {
      http
        .getResponse<{ setHeader(name: string, value: string): void }>()
        .setHeader("Retry-After", String(Math.ceil((window.resetAt - now) / 1000)));

      throw new HttpException(
        "Too many requests, try again later",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private sweep(now: number) {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    }
  }
}
