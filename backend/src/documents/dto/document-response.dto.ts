import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DocumentEntity, DocumentStatus } from "../document.entity.js";

// The API contract for a document. Internal columns (s3Key, tenantId) are never exposed.
export class DocumentResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Employee Handbook 2026" })
  title!: string;

  @ApiProperty({ example: "handbook.pdf" })
  originalFilename!: string;

  @ApiProperty({ example: "application/pdf" })
  mimeType!: string;

  @ApiProperty({ example: 482133 })
  sizeBytes!: number;

  @ApiProperty({ enum: DocumentStatus })
  status!: DocumentStatus;

  @ApiPropertyOptional({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: DocumentEntity): DocumentResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      originalFilename: entity.originalFilename,
      mimeType: entity.mimeType,
      sizeBytes: Number(entity.sizeBytes),
      status: entity.status,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
