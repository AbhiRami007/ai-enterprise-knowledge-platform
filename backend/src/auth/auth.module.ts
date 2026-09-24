import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UserRepository } from "../users/user.repository.js";

@Module({
  providers: [AuthService, UserRepository],
  controllers: [AuthController],
})
export class AuthModule {}
