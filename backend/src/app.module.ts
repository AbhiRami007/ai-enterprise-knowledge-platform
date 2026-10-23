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
        host: config.get<string>("DB_HOST"),
        port: Number(config.get<string>("DB_PORT")),
        username: config.get<string>("DB_USERNAME"),
        password: config.getOrThrow<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE"),
        autoLoadEntities: true,
        // Dev only: auto-create tables from entities. Keep false in production (use migrations).
        synchronize: config.get<string>("DB_SYNC") === "true",
      }),
    }),
    DocumentsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
