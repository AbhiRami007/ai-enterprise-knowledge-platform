import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

// Text fields sent alongside the file in the multipart upload.
export class UploadDocumentDto {
  @ApiPropertyOptional({
    example: "Employee Handbook 2026",
    description: "Display title. Defaults to the file name.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
