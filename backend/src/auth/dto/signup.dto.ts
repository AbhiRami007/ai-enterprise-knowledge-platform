import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

// Either tenantId (ask to join an existing company) or companyName (create a
// new one), never both. SignupService rejects a body with both.
export class SignupDto {
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

  @ApiPropertyOptional({
    format: "uuid",
    description: "Join this company; an admin must approve the account",
  })
  @ValidateIf((body: SignupDto) => body.companyName === undefined)
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    example: "Initech",
    description: "Create this company, with the new user as its admin",
  })
  @ValidateIf((body: SignupDto) => body.tenantId === undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  companyName?: string;
}
