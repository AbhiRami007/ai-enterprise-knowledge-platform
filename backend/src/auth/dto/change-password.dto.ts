import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "Password123!" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string;

  // bcrypt only uses the first 72 bytes of a password.
  @ApiProperty({ example: "a-longer-passphrase", minLength: 12, maxLength: 72 })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  newPassword!: string;
}
