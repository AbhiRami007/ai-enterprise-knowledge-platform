import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRepository } from "../users/user.repository.js";
import * as bcrypt from "bcryptjs";
import { ProfileResponseDto } from "../users/dto/profile-response.dto.js";
import { UserStatus } from "../users/enums/user-status.enum.js";
import { hashPassword } from "../users/password.js";
import { canSignIn } from "../users/user-access.js";
import { TokensService } from "./tokens.service.js";

// 403 with a machine-readable code, so the login page can explain why.
function accountNotActive(code: string, message: string) {
  return new ForbiddenException({
    statusCode: 403,
    error: "Forbidden",
    code,
    message,
  });
}

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

    // Only after a correct password, so this reveals nothing to a guesser.
    if (user.status === UserStatus.Pending) {
      throw accountNotActive(
        "ACCOUNT_PENDING",
        "Your account is waiting for approval by your company's admin"
      );
    }
    if (user.status === UserStatus.Rejected) {
      throw accountNotActive(
        "ACCOUNT_REJECTED",
        "Your request to join was declined. Contact your company's admin"
      );
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

    if (!user || !canSignIn(user)) {
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
    const user = await this.userRepository.findByIdWithTenant(userId);

    if (!user || !canSignIn(user) || !user.tenant) {
      throw new UnauthorizedException();
    }

    return ProfileResponseDto.fromUserAndTenant(user, user.tenant);
  }
}
