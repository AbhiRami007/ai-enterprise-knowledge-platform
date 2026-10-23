import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // bcrypt only uses the first 72 bytes of a password.
  @ApiProperty({ example: "Password123!", maxLength: 72 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
