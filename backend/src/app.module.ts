import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  controllers: [AppController],
  imports: [DocumentsModule, AuthModule],
})
export class AppModule {}
