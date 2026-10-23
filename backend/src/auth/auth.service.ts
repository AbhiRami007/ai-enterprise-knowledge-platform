import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../users/user.repository.js";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserResponseDto } from "../users/dto/user-response.dto.js";
import type { JwtPayload } from "./types/jwt-payload.js";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_PASSWORD_HASH =
  "$2b$10$5cojQHPwZ0GLpvkvPSt0lOk2ZYQdY5x2Rz0fSoKj3GTqBc4JcrWCa";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    const passwordValid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !passwordValid || !user.isActive) {
      return null;
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return UserResponseDto.fromEntity(user);
  }
}
