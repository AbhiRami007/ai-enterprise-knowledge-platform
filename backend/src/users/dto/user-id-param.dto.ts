import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class UserIdParamDto {
  @ApiProperty({ description: "User ID", format: "uuid" })
  @IsUUID()
  id!: string;
}
