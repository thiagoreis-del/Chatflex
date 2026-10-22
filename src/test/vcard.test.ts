import { describe, expect, it } from "vitest";
import { isVCard, parseVCard } from "@/modules/tickets/vcard";

describe("vcard", () => {
  it("detecta vCard no corpo da mensagem", () => {
    expect(isVCard("BEGIN:VCARD\nVERSION:3.0\nEND:VCARD")).toBe(true);
    expect(isVCard("  begin:vcard\nEND:VCARD")).toBe(true);
    expect(isVCard("Olá, tudo bem?")).toBe(false);
    expect(isVCard(null)).toBe(false);
  });

  it("extrai nome e telefone com waid", () => {
    const body = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Silva - B10;Adriana;;;",
      "FN:Adriana Silva - B10",
      "TEL;type=CELL;waid=554599622738:+55 45 9962-2738",
      "END:VCARD",
    ].join("\n");
    expect(parseVCard(body)).toEqual({
      name: "Adriana Silva - B10",
      phone: "+554599622738",
    });
  });

  it("usa o telefone exibido quando não há waid", () => {
    const body = "BEGIN:VCARD\nFN:Adri Silva\nTEL;type=CELL:+55 45 9972-0404\nEND:VCARD";
    expect(parseVCard(body)).toEqual({ name: "Adri Silva", phone: "+55 45 9972-0404" });
  });

  it("monta o nome a partir de N quando FN falta", () => {
    const body = "BEGIN:VCARD\nN:Silva;Adriana;;;\nEND:VCARD";
    expect(parseVCard(body)).toEqual({ name: "Adriana Silva", phone: null });
  });

  it("retorna null para texto comum", () => {
    expect(parseVCard("mensagem normal")).toBeNull();
  });
});
