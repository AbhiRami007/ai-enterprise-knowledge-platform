import { Test, TestingModule } from "@nestjs/testing";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";

describe("DocumentsController", () => {
  let controller: DocumentsController;
  const mockDocumentsService = {
    getDocumentById: jest.fn().mockReturnValue({ id: "doc-123" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: mockDocumentsService }],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it("should return the document from the service", () => {
    expect(controller.getDocument("doc-123")).toEqual({ id: "doc-123" });
    expect(mockDocumentsService.getDocumentById).toHaveBeenCalledWith("doc-123");
  });
});
