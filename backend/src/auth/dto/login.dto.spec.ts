import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, it, expect } from "@jest/globals";
import { LoginDto } from "./login.dto.js";

const toDto = (body: object) => plainToInstance(LoginDto, body);

describe("LoginDto", () => {
  it("should accept a valid email and password", async () => {
    const errors = await validate(
      toDto({ email: "user@example.com", password: "Password123!" })
    );

    expect(errors).toHaveLength(0);
  });

  it("should trim and lowercase the email", () => {
    const dto = toDto({ email: "  User@Example.COM ", password: "x" });

    expect(dto.email).toBe("user@example.com");
  });

  it("should reject a missing password", async () => {
    const errors = await validate(toDto({ email: "user@example.com" }));

    expect(errors.map((e) => e.property)).toEqual(["password"]);
  });

  it("should reject an invalid email", async () => {
    const errors = await validate(
      toDto({ email: "not-an-email", password: "Password123!" })
    );

    expect(errors.map((e) => e.property)).toEqual(["email"]);
  });

  it("should reject a password longer than 72 characters", async () => {
    const errors = await validate(
      toDto({ email: "user@example.com", password: "a".repeat(73) })
    );

    expect(errors.map((e) => e.property)).toEqual(["password"]);
  });

  it("should reject an email longer than 254 characters", async () => {
    const errors = await validate(
      toDto({ email: `${"a".repeat(250)}@x.io`, password: "Password123!" })
    );

    expect(errors.map((e) => e.property)).toEqual(["email"]);
  });
});
