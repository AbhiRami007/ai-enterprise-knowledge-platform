import { ApiProperty } from "@nestjs/swagger";
import { TenantSummaryDto } from "../../users/dto/profile-response.dto.js";

// 202 from POST /auth/signup when asking to join an existing company.
export class SignupPendingResponseDto {
  @ApiProperty({ example: "pending" })
  status!: "pending";

  @ApiProperty({ type: TenantSummaryDto })
  tenant!: TenantSummaryDto;
}
