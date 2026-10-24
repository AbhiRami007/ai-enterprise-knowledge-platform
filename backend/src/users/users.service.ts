import { ConflictException, Injectable } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UserResponseDto } from "./dto/user-response.dto.js";
import { Role } from "./enums/role.enum.js";
import { hashPassword } from "./password.js";
import { UserRepository } from "./user.repository.js";

const UNIQUE_VIOLATION = "23505";

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
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException("A user with this email already exists");
      }

      throw error;
    }
  }
}
