import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity.js";
import { Role } from "./enums/role.enum.js";
import { UserStatus } from "./enums/user-status.enum.js";

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

  countActiveAdmins(tenantId: string): Promise<number> {
    return this.repository.countBy({
      tenantId,
      role: Role.Admin,
      status: UserStatus.Active,
    });
  }

  // Refresh tokens go too: refresh_tokens.user_id is ON DELETE CASCADE.
  async delete(id: string) {
    await this.repository.delete({ id });
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
