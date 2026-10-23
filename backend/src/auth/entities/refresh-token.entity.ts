import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity.js";

// One row per issued refresh token. Only the SHA-256 hash is stored, never the token itself.
@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "token_hash", type: "char", length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  // Set on logout, rotation or when reuse of an old token is detected.
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
