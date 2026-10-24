import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "node:crypto";
import { IsNull, Repository } from "typeorm";
import { User } from "../users/entities/user.entity.js";
import type { IssuedTokens } from "./types/issued-tokens.js";
import { RefreshToken } from "./entities/refresh-token.entity.js";
import type { JwtPayload } from "./types/jwt-payload.js";
import { canSignIn } from "../users/user-access.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

const DAY_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class TokensService {
  private readonly refreshTtlMs: number;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    config: ConfigService
  ) {
    this.refreshTtlMs =
      Number(config.get<string>("REFRESH_TOKEN_TTL_DAYS") ?? 7) * DAY_MS;
  }

  async issue(user: User): Promise<IssuedTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    };
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.refreshTokens.insert({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresAt,
    };
  }

  // Exchanges a refresh token for a new pair. Returns null if the token can't be used.
  async rotate(refreshToken: string): Promise<IssuedTokens | null> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hashToken(refreshToken) },
      relations: { user: true },
    });

    if (!stored) {
      return null;
    }

    // Claim the token atomically so two concurrent refreshes can't both succeed.
    const claimed = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() }
    );

    if (claimed.affected !== 1) {
      // An already-used token came back: assume it was stolen and end every session.
      await this.revokeAllForUser(stored.userId);
      return null;
    }

    if (stored.expiresAt <= new Date() || !canSignIn(stored.user)) {
      return null;
    }

    return this.issue(stored.user);
  }

  async revoke(refreshToken: string) {
    await this.refreshTokens.update(
      { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() }
    );
  }

  async revokeAllForUser(userId: string) {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() }
    );
  }
}
