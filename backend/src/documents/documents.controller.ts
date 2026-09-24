import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

@Controller("api/v1/documents")
@ApiBearerAuth()
export class DocumentsController {
  @Get(":id")
  @ApiOperation({
    summary: "Get a document by ID",
  })
  @ApiParam({
    name: "id",
    description: "Document ID",
    example: "doc-123",
  })
  @ApiOkResponse({
    description: "Document retrieved successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid authentication",
  })
  @ApiNotFoundResponse({
    description: "Document not found",
  })
  getDocument(@Param("id") id: string) {
    return {
      id,
      message: "Document endpoint working",
    };
  }
}
