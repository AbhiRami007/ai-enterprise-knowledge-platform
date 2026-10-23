import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { DocumentsService } from "./documents.service.js";
import { DocumentIdParamDto } from "./dto/document-id-param.dto.js";

@Controller("api/v1/documents")
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}
  @Get(":id")
  @ApiOperation({
    summary: "Get a document by ID",
  })
  @ApiOkResponse({
    description: "Document retrieved successfully",
  })
  @ApiBadRequestResponse({
    description: "ID is not a valid UUID",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid authentication",
  })
  @ApiNotFoundResponse({
    description: "Document not found",
  })
  getDocument(@Param() { id }: DocumentIdParamDto) {
    return this.documentService.getDocumentById(id);
  }
}
