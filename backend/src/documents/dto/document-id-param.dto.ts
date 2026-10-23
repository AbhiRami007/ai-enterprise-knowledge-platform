import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class DocumentIdParamDto {
  @ApiProperty({
    description: "Document ID",
    example: "3f2c8a1e-9b4d-4c6a-8e2f-1a7b5d9c0e34",
  })
  @IsUUID()
  id!: string;
}
