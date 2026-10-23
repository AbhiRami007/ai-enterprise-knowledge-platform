import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UsersModule } from "../users/users.module.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { RefreshToken } from "./entities/refresh-token.entity.js";
import { ACCESS_TOKEN_TTL_SECONDS, TokensService } from "./tokens.service.js";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    TokensService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
