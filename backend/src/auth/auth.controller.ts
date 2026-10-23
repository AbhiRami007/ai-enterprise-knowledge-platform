import {
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
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";

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
    description: "Email or password missing or invalid",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
  })
  // Input shape is validated by the global ValidationPipe before this runs.
  async login(@Body() body: LoginDto) {
    const accessToken = await this.authService.login(body.email, body.password);

    if (!accessToken) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return { accessToken };
  }
}
