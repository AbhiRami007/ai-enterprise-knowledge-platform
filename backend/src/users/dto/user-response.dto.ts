import { ApiProperty } from "@nestjs/swagger";
import { User } from "../entities/user.entity.js";
import { Role } from "../enums/role.enum.js";

// The API contract for a user. The password hash is never exposed.
export class UserResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ format: "uuid" })
  tenantId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(entity: User): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      tenantId: entity.tenantId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    };
  }
}
