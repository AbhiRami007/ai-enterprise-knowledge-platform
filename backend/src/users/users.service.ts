import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UserResponseDto } from "./dto/user-response.dto.js";
import { Role } from "./enums/role.enum.js";
import { UserStatus } from "./enums/user-status.enum.js";
import { hashPassword } from "./password.js";
import { isUniqueViolation } from "./unique-violation.js";
import { UserRepository } from "./user.repository.js";

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAllInTenant(tenantId: string) {
    const users = await this.userRepository.findAllByTenant(tenantId);
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  async create(tenantId: string, dto: CreateUserDto) {
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ConflictException("A user with this email already exists");
    }

    try {
      const user = await this.userRepository.create({
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        role: dto.role ?? Role.Viewer,
        tenantId,
      });

      return UserResponseDto.fromEntity(user);
    } catch (error) {
      // Another request created the same email between the check and the insert.
      if (isUniqueViolation(error)) {
        throw new ConflictException("A user with this email already exists");
      }

      throw error;
    }
  }

  // Pending or previously rejected -> active, with the role the admin chose.
  async approve(tenantId: string, userId: string, role = Role.Viewer) {
    await this.findRequest(tenantId, userId, [
      UserStatus.Pending,
      UserStatus.Rejected,
    ]);
    await this.userRepository.updateStatus(userId, {
      status: UserStatus.Active,
      role,
      rejectedAt: null,
    });
    return this.reload(userId);
  }

  // Only pending requests can be rejected; to remove an active user, an
  // admin would disable them instead.
  async reject(tenantId: string, userId: string) {
    await this.findRequest(tenantId, userId, [UserStatus.Pending]);
    await this.userRepository.updateStatus(userId, {
      status: UserStatus.Rejected,
      rejectedAt: new Date(),
    });
    return this.reload(userId);
  }

  // 404 for another tenant's user or one in the wrong state, so an admin
  // learns nothing about users outside their own company.
  private async findRequest(
    tenantId: string,
    userId: string,
    allowed: UserStatus[]
  ) {
    const user = await this.userRepository.findByIdInTenant(userId, tenantId);
    if (!user || !allowed.includes(user.status)) {
      throw new NotFoundException("Join request not found");
    }
    return user;
  }

  private async reload(userId: string) {
    const user = await this.userRepository.findById(userId);
    return UserResponseDto.fromEntity(user!);
  }
}
