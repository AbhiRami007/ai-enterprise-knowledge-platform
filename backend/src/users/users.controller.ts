import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import type { JwtPayload } from "../auth/types/jwt-payload.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UserResponseDto } from "./dto/user-response.dto.js";
import { Role } from "./enums/role.enum.js";
import { UsersService } from "./users.service.js";

@Controller("api/v1/users")
@ApiBearerAuth()
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: "List the users in the admin's tenant, newest first",
  })
  @ApiOkResponse({
    type: UserResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiForbiddenResponse({
    description: "Caller is not an admin",
  })
  // The tenant comes from the token, never from the request.
  findAll(@CurrentUser() admin: JwtPayload) {
    return this.usersService.findAllInTenant(admin.tenantId);
  }

  @Post()
  @ApiOperation({
    summary: "Create a user in the admin's tenant",
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Email, password or role invalid",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token",
  })
  @ApiForbiddenResponse({
    description: "Caller is not an admin",
  })
  @ApiConflictResponse({
    description: "Email already in use",
  })
  create(@CurrentUser() admin: JwtPayload, @Body() body: CreateUserDto) {
    return this.usersService.create(admin.tenantId, body);
  }
}
