import { Injectable } from "@nestjs/common";
import { UserRepository } from "../users/user.repository.js";
import { JwtService } from "@nestjs/jwt";

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

    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
  }
}
