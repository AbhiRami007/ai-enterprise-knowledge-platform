import { ApiProperty } from "@nestjs/swagger";
import { Tenant } from "../../tenants/entities/tenant.entity.js";
import { User } from "../entities/user.entity.js";
import { UserResponseDto } from "./user-response.dto.js";

export class TenantSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Acme Corp" })
  name!: string;
}

// GET /auth/me: the user plus their company, so the UI can show its name.
export class ProfileResponseDto extends UserResponseDto {
  @ApiProperty({ type: TenantSummaryDto })
  tenant!: TenantSummaryDto;

  static fromUserAndTenant(user: User, tenant: Tenant): ProfileResponseDto {
    return {
      ...UserResponseDto.fromEntity(user),
      tenant: { id: tenant.id, name: tenant.name },
    };
  }
}
