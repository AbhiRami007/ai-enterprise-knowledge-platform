import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { ChangePasswordDto } from "./dto/change-password.dto.js";
import { AccessTokenResponseDto } from "./dto/access-token-response.dto.js";
import type { IssuedTokens } from "./types/issued-tokens.js";
import { Public } from "./decorators/public.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { RateLimit } from "./decorators/rate-limit.decorator.js";
import type { JwtPayload } from "./types/jwt-payload.js";
import { UserResponseDto } from "../users/dto/user-response.dto.js";
import {
  REFRESH_TOKEN_COOKIE,
  clearRefreshCookie,
  setRefreshCookie,
} from "./refresh-token.cookie.js";

// Slows down password guessing: 5 attempts per minute per IP.
const PASSWORD_ATTEMPT_LIMIT = { limit: 5, windowMs: 60_000 };

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit(PASSWORD_ATTEMPT_LIMIT)
  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Log in with email and password",
  })
  @ApiOkResponse({
    type: AccessTokenResponseDto,
    description: "Access token issued; refresh token set as an httpOnly cookie",
  })
  @ApiBadRequestResponse({
    description: "Email or password missing or invalid",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
  })
  @ApiTooManyRequestsResponse({
    description: "Too many login attempts",
  })
  // Input shape is validated by the global ValidationPipe before this runs.
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(body.email, body.password);

    if (!tokens) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.sendTokens(res, tokens);
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({
    summary: "Exchange a refresh token for a new token pair",
    description:
      "Reads the refresh token from the httpOnly cookie and replaces it. Refresh tokens are single-use. Reusing an old one revokes every session for that user.",
  })
  @ApiOkResponse({
    type: AccessTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Refresh token invalid, expired or already used",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.authService.refresh(refreshToken);

    if (!tokens) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Refresh tokens are single-use, so the cookie must be replaced every time.
    return this.sendTokens(res, tokens);
  }

  // Public so it still works after the access token has expired.
  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiOperation({
    summary: "Revoke a refresh token",
  })
  @ApiNoContentResponse({
    description: "Logged out (also returned for unknown tokens)",
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Cleared even for unknown tokens so the browser never keeps a dead one.
    clearRefreshCookie(res);
  }

  @Post("logout-all")
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Revoke every session of the logged-in user",
  })
  @ApiNoContentResponse({
    description: "All refresh tokens revoked",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logoutAll(user.sub);

    // This browser's refresh token was revoked too.
    clearRefreshCookie(res);
  }

  @RateLimit(PASSWORD_ATTEMPT_LIMIT)
  @Patch("password")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change the logged-in user's password",
    description:
      "Revokes every refresh token for the user and returns a new pair for this session.",
  })
  @ApiOkResponse({
    type: AccessTokenResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Current password incorrect, or new password invalid or unchanged",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword
    );

    return this.sendTokens(res, tokens);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the logged-in user",
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  // The refresh token travels only in the httpOnly cookie, never in the body.
  private sendTokens(res: Response, tokens: IssuedTokens): AccessTokenResponseDto {
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }
}
