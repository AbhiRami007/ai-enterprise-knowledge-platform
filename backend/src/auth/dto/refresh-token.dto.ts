import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token returned by login or refresh" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  refreshToken!: string;
}
