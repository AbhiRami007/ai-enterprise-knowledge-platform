import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Tenant } from "../tenants/entities/tenant.entity.js";
import { TenantRepository } from "../tenants/tenant.repository.js";
import { User } from "../users/entities/user.entity.js";
import { Role } from "../users/enums/role.enum.js";
import { UserStatus } from "../users/enums/user-status.enum.js";
import { hashPassword } from "../users/password.js";
import { isUniqueViolation } from "../users/unique-violation.js";
import { UserRepository } from "../users/user.repository.js";
import { SignupDto } from "./dto/signup.dto.js";
import { TokensService } from "./tokens.service.js";
import type { IssuedTokens } from "./types/issued-tokens.js";

export type SignupResult =
  | { kind: "pending"; tenant: Pick<Tenant, "id" | "name"> }
  | { kind: "created"; tenant: Pick<Tenant, "id" | "name">; tokens: IssuedTokens };

const EMAIL_TAKEN = "This email is already registered";

@Injectable()
export class SignupService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenants: TenantRepository,
    private readonly users: UserRepository,
    private readonly tokensService: TokensService
  ) {}

  async signup(dto: SignupDto): Promise<SignupResult> {
    if (dto.tenantId && dto.companyName) {
      throw new BadRequestException(
        "Send either tenantId or companyName, not both"
      );
    }

    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }

    return dto.tenantId
      ? this.requestToJoin(dto.tenantId, dto)
      : this.createCompany(dto.companyName!, dto);
  }

  // Creates a pending viewer. No tokens: they can't log in until an admin of
  // that company approves them (and picks their real role).
  private async requestToJoin(tenantId: string, dto: SignupDto) {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException("Company not found");
    }

    try {
      await this.users.create({
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        role: Role.Viewer,
        status: UserStatus.Pending,
        tenantId: tenant.id,
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }

    return { kind: "pending" as const, tenant: { id: tenant.id, name: tenant.name } };
  }

  // A brand-new company has nobody to approve its first user, so they become
  // its admin and are logged in straight away.
  private async createCompany(companyName: string, dto: SignupDto) {
    if (await this.tenants.findByName(companyName)) {
      throw new ConflictException("A company with this name already exists");
    }

    const passwordHash = await hashPassword(dto.password);

    let user: User;
    let tenant: Tenant;
    try {
      // One transaction: if creating the user fails, the company isn't left
      // behind without anyone in it.
      ({ user, tenant } = await this.dataSource.transaction(async (manager) => {
        const tenant = await manager.save(
          manager.create(Tenant, { name: companyName })
        );
        const user = await manager.save(
          manager.create(User, {
            email: dto.email,
            passwordHash,
            role: Role.Admin,
            status: UserStatus.Active,
            tenantId: tenant.id,
          })
        );
        return { user, tenant };
      }));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }

    return {
      kind: "created" as const,
      tenant: { id: tenant.id, name: tenant.name },
      tokens: await this.tokensService.issue(user),
    };
  }
}
