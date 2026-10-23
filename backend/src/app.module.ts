import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  controllers: [AppController],
  imports: [
    // Loads the repo-root .env (shared with docker-compose) into process.env.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../.env", ".env"] }),
    DatabaseModule,
    DocumentsModule,
    AuthModule,
  ],
})
export class AppModule {}
