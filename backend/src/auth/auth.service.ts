import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRepository } from "../users/user.repository.js";
import * as bcrypt from "bcryptjs";
import { UserResponseDto } from "../users/dto/user-response.dto.js";
import { hashPassword } from "../users/password.js";
import { TokensService } from "./tokens.service.js";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_PASSWORD_HASH =
  "$2b$10$5cojQHPwZ0GLpvkvPSt0lOk2ZYQdY5x2Rz0fSoKj3GTqBc4JcrWCa";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokensService: TokensService
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

    return this.tokensService.issue(user);
  }

  refresh(refreshToken: string) {
    return this.tokensService.rotate(refreshToken);
  }

  logout(refreshToken: string) {
    return this.tokensService.revoke(refreshToken);
  }

  logoutAll(userId: string) {
    return this.tokensService.revokeAllForUser(userId);
  }

  // Ends every other session and returns a fresh token pair for the caller.
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException("Current password is incorrect");
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        "New password must differ from the current one"
      );
    }

    await this.userRepository.updatePasswordHash(
      user.id,
      await hashPassword(newPassword)
    );
    await this.tokensService.revokeAllForUser(user.id);

    return this.tokensService.issue(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return UserResponseDto.fromEntity(user);
  }
}
