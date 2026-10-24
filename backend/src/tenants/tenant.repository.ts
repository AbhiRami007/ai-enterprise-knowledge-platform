import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Tenant } from "./entities/tenant.entity.js";

// % and _ are wildcards in LIKE; escape them so they match literally.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, "\\$&");
}

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repository: Repository<Tenant>
  ) {}

  findById(id: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ id });
  }

  // Case-insensitive exact match, so "acme corp" is caught as a duplicate.
  findByName(name: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ name: ILike(escapeLike(name)) });
  }

  // Name contains the query, case-insensitive, alphabetical.
  search(query: string, limit: number): Promise<Tenant[]> {
    return this.repository.find({
      select: { id: true, name: true },
      where: { name: ILike(`%${escapeLike(query)}%`) },
      order: { name: "ASC" },
      take: limit,
    });
  }

  create(data: Pick<Tenant, "name">) {
    return this.repository.save(this.repository.create(data));
  }
}
