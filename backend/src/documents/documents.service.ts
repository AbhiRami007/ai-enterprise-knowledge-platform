import { Injectable } from "@nestjs/common";

@Injectable()
export class DocumentsService {
  getDocuments() {
    return [
      {
        id: "doc-123",
        title: "Test Document",
      },
      {
        id: "doc-345",
        title: "Test Document2",
      },
    ];
  }

  getDocumentById(id: string) {
    return {
      id: "doc-123",
      title: "Test Document",
    };
  }
}
