import { describe, beforeEach, it, expect } from "@jest/globals";
import { DocumentsService } from "./documents.service.js";

describe("DocumentsService", () => {
  let service: DocumentsService;
  let mockResolvedData = [
    {
      id: "doc-123",
      title: "Test Document",
    },
    {
      id: "doc-345",
      title: "Test Document2",
    },
  ];

  beforeEach(() => {
    service = new DocumentsService();
  });

  it("should return a document by id", async () => {
    const result = await service.getDocumentById("doc-123");

    expect(result).toEqual(mockResolvedData[0]);
  });

  it("should return a document by id", async () => {
    const result = await service.getDocuments();

    expect(result).toEqual(mockResolvedData);
  });
});
