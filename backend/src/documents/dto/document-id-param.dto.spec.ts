import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, it, expect } from "@jest/globals";
import { DocumentIdParamDto } from "./document-id-param.dto.js";

describe("DocumentIdParamDto", () => {
  it("should accept a UUID", async () => {
    const dto = plainToInstance(DocumentIdParamDto, {
      id: "3f2c8a1e-9b4d-4c6a-8e2f-1a7b5d9c0e34",
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it("should reject a non-UUID id", async () => {
    const dto = plainToInstance(DocumentIdParamDto, { id: "doc-123" });

    expect((await validate(dto)).map((e) => e.property)).toEqual(["id"]);
  });
});
