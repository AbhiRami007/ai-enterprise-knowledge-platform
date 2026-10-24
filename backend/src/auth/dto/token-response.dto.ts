import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
  @ApiProperty({
    description: "JWT to send as `Authorization: Bearer <token>`",
  })
  accessToken!: string;

  @ApiProperty({ description: "Single-use token for POST /auth/refresh" })
  refreshToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: "Bearer";

  @ApiProperty({
    description: "Access token lifetime in seconds",
    example: 900,
  })
  expiresIn!: number;

  refreshTokenExpiresAt!: Date;
}
