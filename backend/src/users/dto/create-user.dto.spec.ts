import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, it, expect } from "@jest/globals";
import { CreateUserDto } from "./create-user.dto.js";

async function errorsFor(body: object) {
  const errors = await validate(plainToInstance(CreateUserDto, body));
  return errors.map((e) => e.property);
}

const valid = { email: "new@example.com", password: "a-longer-passphrase" };

describe("CreateUserDto", () => {
  it("should accept a valid user without a role", async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  it("should accept a known role", async () => {
    expect(await errorsFor({ ...valid, role: "editor" })).toEqual([]);
  });

  it("should reject an unknown role", async () => {
    expect(await errorsFor({ ...valid, role: "superuser" })).toEqual(["role"]);
  });

  it("should reject a password shorter than 12 characters", async () => {
    expect(await errorsFor({ ...valid, password: "short" })).toEqual([
      "password",
    ]);
  });

  it("should normalise the email", () => {
    const dto = plainToInstance(CreateUserDto, {
      ...valid,
      email: " New@Example.com ",
    });

    expect(dto.email).toBe("new@example.com");
  });
});
