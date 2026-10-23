import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "../enums/role.enum.js";

// The tenant is never taken from the body: users are created in the admin's own tenant.
export class CreateUserDto {
  @ApiProperty({ example: "new.user@example.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // bcrypt only uses the first 72 bytes of a password.
  @ApiProperty({ example: "a-longer-passphrase", minLength: 12, maxLength: 72 })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.Viewer })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
