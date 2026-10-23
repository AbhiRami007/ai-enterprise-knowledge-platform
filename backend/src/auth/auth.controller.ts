import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { ChangePasswordDto } from "./dto/change-password.dto.js";
import { TokenResponseDto } from "./dto/token-response.dto.js";
import { Public } from "./decorators/public.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import type { JwtPayload } from "./types/jwt-payload.js";
import { UserResponseDto } from "../users/dto/user-response.dto.js";

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Log in with email and password",
  })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: "Access and refresh tokens issued",
  })
  @ApiBadRequestResponse({
    description: "Email or password missing or invalid",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
  })
  // Input shape is validated by the global ValidationPipe before this runs.
  async login(@Body() body: LoginDto) {
    const tokens = await this.authService.login(body.email, body.password);

    if (!tokens) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return tokens;
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({
    summary: "Exchange a refresh token for a new token pair",
    description:
      "Refresh tokens are single-use. Reusing an old one revokes every session for that user.",
  })
  @ApiOkResponse({
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Refresh token invalid, expired or already used",
  })
  async refresh(@Body() body: RefreshTokenDto) {
    const tokens = await this.authService.refresh(body.refreshToken);

    if (!tokens) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return tokens;
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
  async logout(@Body() body: RefreshTokenDto) {
    await this.authService.logout(body.refreshToken);
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
  async logoutAll(@CurrentUser() user: JwtPayload) {
    await this.authService.logoutAll(user.sub);
  }

  @Patch("password")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change the logged-in user's password",
    description:
      "Revokes every refresh token for the user and returns a new pair for this session.",
  })
  @ApiOkResponse({
    type: TokenResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Current password incorrect, or new password invalid or unchanged",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePasswordDto
  ) {
    return this.authService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword
    );
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
}
