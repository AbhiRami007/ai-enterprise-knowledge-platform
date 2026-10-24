import type { CookieOptions, Response } from "express";

export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Shared by set and clear: the browser only removes a cookie if name and path match.
const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/v1/auth",
};

export function setRefreshCookie(
  res: Response,
  token: string,
  expiresAt: Date
) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...baseOptions,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions);
}
