import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import type { JwtPayload } from "../auth/types/jwt-payload.js";
import { ApproveUserDto } from "./dto/approve-user.dto.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UserIdParamDto } from "./dto/user-id-param.dto.js";
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

  @Patch(":id/approve")
  @ApiOperation({
    summary: "Approve a pending or rejected join request",
    description: "The user becomes active with the given role (viewer by default).",
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiForbiddenResponse({
    description: "Caller is not an admin",
  })
  @ApiNotFoundResponse({
    description: "No pending or rejected request with this id in the admin's tenant",
  })
  approve(
    @CurrentUser() admin: JwtPayload,
    @Param() { id }: UserIdParamDto,
    @Body() body: ApproveUserDto
  ) {
    return this.usersService.approve(admin.tenantId, id, body.role);
  }

  @Patch(":id/reject")
  @ApiOperation({
    summary: "Reject a pending join request",
    description: "The request is kept as rejected and can still be approved later.",
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiForbiddenResponse({
    description: "Caller is not an admin",
  })
  @ApiNotFoundResponse({
    description: "No pending request with this id in the admin's tenant",
  })
  reject(@CurrentUser() admin: JwtPayload, @Param() { id }: UserIdParamDto) {
    return this.usersService.reject(admin.tenantId, id);
  }
}
