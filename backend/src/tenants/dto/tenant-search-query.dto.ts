import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";

export class TenantSearchQueryDto {
  // At least 2 characters, so the endpoint can't list every company at once.
  @ApiProperty({ example: "acme", minLength: 2, maxLength: 100 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  q!: string;
}
