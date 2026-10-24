import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module.js";
import { TenantRepository } from "../tenants/tenant.repository.js";
import { Role } from "../users/enums/role.enum.js";
import { UserRepository } from "../users/user.repository.js";
import { UsersService } from "../users/users.service.js";

// Creates the first admin of a tenant. Run with: npm run seed:admin
// Reads SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, plus either SEED_TENANT_NAME
// (creates a new tenant) or SEED_TENANT_ID (adds the admin to an existing one).
async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const tenantId = process.env.SEED_TENANT_ID?.trim();
  const tenantName = process.env.SEED_TENANT_NAME?.trim();

  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error("SEED_ADMIN_PASSWORD must be 12-72 characters");
  }

  if (!tenantId && !tenantName) {
    throw new Error(
      "Set SEED_TENANT_NAME to create a tenant, or SEED_TENANT_ID to use an existing one"
    );
  }

  if (tenantName && tenantName.length > 100) {
    throw new Error("SEED_TENANT_NAME must be at most 100 characters");
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });

  try {
    if (await app.get(UserRepository).findByEmail(email)) {
      console.log(`User ${email} already exists, nothing to do.`);
      return;
    }

    const tenants = app.get(TenantRepository);
    const tenant = tenantId
      ? await tenants.findById(tenantId)
      : await tenants.create({ name: tenantName! });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} does not exist`);
    }

    const admin = await app
      .get(UsersService)
      .create(tenant.id, { email, password, role: Role.Admin });

    console.log(
      `Created admin ${admin.email} in tenant "${tenant.name}" (${tenant.id})`
    );
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
