import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity.js";
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

  // Same tenant_id column as above, as a foreign key: a user can't point at a
  // tenant that doesn't exist, and a tenant with users can't be deleted.
  // Only loaded when asked for (see UserRepository.findByIdWithTenant).
  @ManyToOne(() => Tenant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "tenant_id" })
  tenant?: Tenant;

  // Disabled users cannot log in or refresh tokens.
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
