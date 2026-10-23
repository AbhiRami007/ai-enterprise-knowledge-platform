import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module.js";
import { Role } from "../users/enums/role.enum.js";
import { UserRepository } from "../users/user.repository.js";
import { UsersService } from "../users/users.service.js";

// Creates the first admin of a tenant. Run with: npm run seed:admin
// Reads SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and optionally SEED_TENANT_ID (a new one is generated if unset).
async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const tenantId = process.env.SEED_TENANT_ID || randomUUID();

  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error("SEED_ADMIN_PASSWORD must be 12-72 characters");
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });

  try {
    if (await app.get(UserRepository).findByEmail(email)) {
      console.log(`User ${email} already exists, nothing to do.`);
      return;
    }

    const admin = await app
      .get(UsersService)
      .create(tenantId, { email, password, role: Role.Admin });

    console.log(`Created admin ${admin.email} in tenant ${admin.tenantId}`);
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
