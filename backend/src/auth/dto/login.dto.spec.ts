import { describe, it, expect } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto.js";

async function errorsFor(body: object) {
  const errors = await validate(plainToInstance(LoginDto, body));
  return errors.map((e) => e.property);
}

describe("LoginDto", () => {
  it("accepts a valid email and password", async () => {
    expect(await errorsFor({ email: "user@example.com", password: "Password123!" })).toEqual([]);
  });

  it("rejects a missing password", async () => {
    expect(await errorsFor({ email: "user@example.com" })).toContain("password");
  });

  it("rejects an invalid email", async () => {
    expect(await errorsFor({ email: "not-an-email", password: "x" })).toContain("email");
  });
});
