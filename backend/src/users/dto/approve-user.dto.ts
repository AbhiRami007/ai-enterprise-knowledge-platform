import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { Role } from "../enums/role.enum.js";

export class ApproveUserDto {
  // The admin picks the role when approving; people asking to join can't.
  @ApiPropertyOptional({ enum: Role, default: Role.Viewer })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
