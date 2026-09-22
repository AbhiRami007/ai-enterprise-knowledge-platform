import { Injectable } from "@nestjs/common";

@Injectable()
export class DocumentsService {
  getDocuments() {
    return ["document-1", "document-2"];
  }
}
