import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "../enums/role.enum.js";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Stored lowercased; LoginDto and CreateUserDto normalise before lookup.
  @Column({ type: "varchar", length: 254, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 60 })
  passwordHash!: string;

  @Column({ type: "enum", enum: Role, default: Role.Viewer })
  role!: Role;

  @Index()
  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  // Disabled users cannot log in or refresh tokens.
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
