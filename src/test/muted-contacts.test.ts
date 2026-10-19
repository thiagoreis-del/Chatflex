import { describe, expect, it } from "vitest";
import { isMuted, mutedKey, setMuted } from "@/modules/tickets/muted-contacts";

describe("silenciar contatos e grupos", () => {
  it("fica silenciado até reativar manualmente", () => {
    const key = mutedKey(1, 10);
    setMuted(key, 55, true);
    expect(isMuted(key, 55)).toBe(true);
    setMuted(key, 55, false);
    expect(isMuted(key, 55)).toBe(false);
  });

  it("é individual por contato e por atendente", () => {
    const a = mutedKey(1, 10);
    const b = mutedKey(1, 11);
    setMuted(a, 7, true);
    expect(isMuted(a, 8)).toBe(false);
    expect(isMuted(b, 7)).toBe(false);
  });
});
