import { ApiProperty } from "@nestjs/swagger";

// The refresh token is not part of the body; it is set as an httpOnly cookie.
export class AccessTokenResponseDto {
  @ApiProperty({
    description: "JWT to send as `Authorization: Bearer <token>`",
  })
  accessToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: "Bearer";

  @ApiProperty({
    description: "Access token lifetime in seconds",
    example: 900,
  })
  expiresIn!: number;
}
