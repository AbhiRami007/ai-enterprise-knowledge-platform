import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return "AI Enterprise Knowledge Platform API";
  }
}
