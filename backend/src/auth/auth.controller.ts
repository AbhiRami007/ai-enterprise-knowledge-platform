import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Password123!" })
  password!: string;
}

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Log in with email and password",
  })
  @ApiOkResponse({
    description: "Access token issued",
  })
  @ApiBadRequestResponse({
    description: "Email or password missing",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
  })
  async login(@Body() body: LoginDto) {
    if (typeof body?.email !== "string" || typeof body?.password !== "string") {
      throw new BadRequestException("email and password are required");
    }

    const accessToken = await this.authService.login(body.email, body.password);

    if (!accessToken) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return { accessToken };
  }
}
