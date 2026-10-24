import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "./entities/tenant.entity.js";
import { TenantRepository } from "./tenant.repository.js";
import { TenantsController } from "./tenants.controller.js";

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantRepository],
  exports: [TenantRepository],
})
export class TenantsModule {}
