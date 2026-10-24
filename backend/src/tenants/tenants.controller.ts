import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { RateLimit } from "../auth/decorators/rate-limit.decorator.js";
import { TenantSummaryDto } from "../users/dto/profile-response.dto.js";
import { TenantSearchQueryDto } from "./dto/tenant-search-query.dto.js";
import { TenantRepository } from "./tenant.repository.js";

const MAX_RESULTS = 10;

@Controller("api/v1/tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantRepository) {}

  // Public, for the signup page's company picker. Returns only id and name,
  // at most 10 at a time, and is rate-limited so the full customer list
  // can't be scraped quickly.
  @Public()
  @RateLimit({ limit: 30, windowMs: 60_000 })
  @Get("search")
  @ApiOperation({
    summary: "Search companies by name, for signup",
  })
  @ApiOkResponse({
    type: TenantSummaryDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: "q must be 2-100 characters",
  })
  @ApiTooManyRequestsResponse({
    description: "Too many searches",
  })
  async search(@Query() { q }: TenantSearchQueryDto) {
    const tenants = await this.tenants.search(q, MAX_RESULTS);
    return tenants.map(({ id, name }) => ({ id, name }));
  }
}
