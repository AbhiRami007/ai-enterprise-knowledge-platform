import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

// A customer company. Every user, and later every document, belongs to one.
@Entity("tenants")
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Shown in the UI so users can see which company they are signed in to.
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
