import { Injectable } from "@nestjs/common";
import { UserRepository } from "../users/user.repository.js";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return null;
    }

    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
  }
}
