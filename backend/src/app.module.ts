import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { DocumentsModule } from "./documents/documents.module.js";

@Module({
  controllers: [AppController],
  imports: [DocumentsModule],
})
export class AppModule {}
