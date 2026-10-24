import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UsersModule } from "../users/users.module.js";
import { TenantsModule } from "../tenants/tenants.module.js";
import { SignupService } from "./signup.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";
import { RateLimitGuard } from "./guards/rate-limit.guard.js";
import { RefreshToken } from "./entities/refresh-token.entity.js";
import { ACCESS_TOKEN_TTL_SECONDS, TokensService } from "./tokens.service.js";

@Module({
  imports: [
    UsersModule,
    TenantsModule,
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
    SignupService,
    TokensService,
    // Order matters: rate limits apply before auth, and RolesGuard reads the user that JwtAuthGuard attaches.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
