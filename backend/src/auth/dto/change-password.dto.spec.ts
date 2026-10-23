import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, it, expect } from "@jest/globals";
import { ChangePasswordDto } from "./change-password.dto.js";

async function errorsFor(body: object) {
  const errors = await validate(plainToInstance(ChangePasswordDto, body));
  return errors.map((e) => e.property);
}

describe("ChangePasswordDto", () => {
  it("should accept a valid current and new password", async () => {
    expect(
      await errorsFor({
        currentPassword: "Password123!",
        newPassword: "a-longer-passphrase",
      })
    ).toEqual([]);
  });

  it("should reject a new password shorter than 12 characters", async () => {
    expect(
      await errorsFor({ currentPassword: "Password123!", newPassword: "short" })
    ).toEqual(["newPassword"]);
  });

  it("should reject a new password longer than 72 characters", async () => {
    expect(
      await errorsFor({
        currentPassword: "Password123!",
        newPassword: "a".repeat(73),
      })
    ).toEqual(["newPassword"]);
  });

  it("should reject a missing current password", async () => {
    expect(await errorsFor({ newPassword: "a-longer-passphrase" })).toEqual([
      "currentPassword",
    ]);
  });
});
