import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator.js";

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return "AI Enterprise Knowledge Platform API";
  }
}
