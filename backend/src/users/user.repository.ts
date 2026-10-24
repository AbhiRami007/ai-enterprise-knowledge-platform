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

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.repository.update({ id }, { passwordHash });
  }

  create(data: Pick<User, "email" | "passwordHash" | "role" | "tenantId">) {
    return this.repository.save(this.repository.create(data));
  }
}
