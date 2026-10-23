import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "rateLimit";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

// Allows at most `limit` requests per client IP to this route within `windowMs`.
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
