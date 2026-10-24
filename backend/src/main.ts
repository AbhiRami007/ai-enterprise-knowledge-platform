import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties without validation decorators
      forbidNonWhitelisted: true, // reject requests that send unknown properties
      transform: true, // turn plain JSON into DTO class instances
    })
  );

  const config = new DocumentBuilder()
    .setTitle("AI Enterprise Knowledge Platform API")
    .setDescription("Backend API for the enterprise knowledge platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3000);
}

bootstrap();
