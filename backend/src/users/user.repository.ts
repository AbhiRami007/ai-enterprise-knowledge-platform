import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity.js";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  findByIdWithTenant(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id }, relations: { tenant: true } });
  }

  // Always filtered by tenant: one company must never see another's users.
  findAllByTenant(tenantId: string): Promise<User[]> {
    return this.repository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  // Tenant in the WHERE clause, so an admin can never load another
  // company's user by guessing its id.
  findByIdInTenant(id: string, tenantId: string): Promise<User | null> {
    return this.repository.findOneBy({ id, tenantId });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.repository.update({ id }, { passwordHash });
  }

  async updateStatus(
    id: string,
    fields: Partial<Pick<User, "status" | "role" | "rejectedAt">>
  ) {
    await this.repository.update({ id }, fields);
  }

  create(
    data: Pick<User, "email" | "passwordHash" | "role" | "tenantId"> &
      Partial<Pick<User, "status">>
  ) {
    return this.repository.save(this.repository.create(data));
  }
}
