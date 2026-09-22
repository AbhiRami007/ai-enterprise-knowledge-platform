import { Controller, Get } from "@nestjs/common";
import { DocumentsService } from "./documents.service.js";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  getDocuments() {
    return this.documentsService.getDocuments();
  }
}
