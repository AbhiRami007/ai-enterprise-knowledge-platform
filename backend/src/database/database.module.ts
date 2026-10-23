import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres",
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_DATABASE ?? "knowledge_platform",
        username: process.env.DB_USERNAME ?? "app_user",
        password: process.env.DB_PASSWORD,
        autoLoadEntities: true,
        // Dev only: auto-creates tables from entities. Replaced by migrations before deploying.
        synchronize: process.env.DB_SYNC === "true",
      }),
    }),
  ],
})
export class DatabaseModule {}
