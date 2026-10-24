import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "./entities/tenant.entity.js";
import { TenantRepository } from "./tenant.repository.js";

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantRepository],
  exports: [TenantRepository],
})
export class TenantsModule {}
