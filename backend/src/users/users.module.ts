import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantsModule } from "../tenants/tenants.module.js";
import { User } from "./entities/user.entity.js";
import { UserRepository } from "./user.repository.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([User]), TenantsModule],
  controllers: [UsersController],
  providers: [UserRepository, UsersService],
  exports: [UserRepository, UsersService],
})
export class UsersModule {}
