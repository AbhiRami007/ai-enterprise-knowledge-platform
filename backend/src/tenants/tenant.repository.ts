import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "./entities/tenant.entity.js";

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repository: Repository<Tenant>
  ) {}

  findById(id: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ id });
  }

  create(data: Pick<Tenant, "name">) {
    return this.repository.save(this.repository.create(data));
  }
}
