import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../.env"],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        host: config.get<string>("DB_HOST", "localhost"),
        port: Number(config.get<string>("DB_PORT", "5432")),
        username: config.get<string>("DB_USERNAME", "app_user"),
        password: config.getOrThrow<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE", "knowledge_platform"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    DocumentsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
