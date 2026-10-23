import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  controllers: [AppController],
  imports: [DatabaseModule, DocumentsModule, AuthModule],
})
export class AppModule {}
