import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UserRepository } from "../users/user.repository.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "development-secret",
      signOptions: {
        expiresIn: "15m",
      },
    }),
  ],
  providers: [AuthService, UserRepository],
  controllers: [AuthController],
})
export class AuthModule {}
