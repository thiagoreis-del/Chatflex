import { describe, expect, it } from "vitest";
import { generatePassword } from "@/shared/auth/generate-password";

describe("automatic account passwords", () => {
  it("generates 16 characters with every character category", () => {
    for (let i = 0; i < 100; i++) {
      const password = generatePassword();
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[2-9]/);
      expect(password).toMatch(/[@#$%&*]/);
    }
  });
  it("creates independent passwords rather than a fixed default", () => {
    expect(new Set(Array.from({ length: 100 }, () => generatePassword())).size).toBe(100);
  });
  it("rejects lengths outside the credential validation limits", () => {
    expect(() => generatePassword(7)).toThrow(RangeError);
    expect(() => generatePassword(129)).toThrow(RangeError);
  });
});