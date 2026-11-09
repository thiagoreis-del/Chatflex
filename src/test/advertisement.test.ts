import { describe, expect, it } from "vitest";
import { parseAdvertisement } from "@/modules/tickets/advertisement";

describe("advertisement", () => {
  it("separa a miniatura e a mensagem recebida do anúncio", () => {
    const body = [
      "data:image/png;base64, aGVsbG8=",
      "https://facebook.com/ad/123",
      "Anvat Soluções",
      "Software de gestão",
      "Quero saber mais sobre o sistema Notas Flex.",
    ].join(" | ");

    expect(parseAdvertisement(body)).toEqual({
      thumbnailUrl: "data:image/png;base64,aGVsbG8=",
      sourceUrl: "https://facebook.com/ad/123",
      title: "Anvat Soluções",
      description: "Software de gestão",
      message: "Quero saber mais sobre o sistema Notas Flex.",
    });
  });

  it("não confunde localização ou texto comum com anúncio", () => {
    expect(
      parseAdvertisement(
        "data:image/png;base64, aGVsbG8= | https://maps.google.com/maps?q=-24.9,-53.4 | -24.9,-53.4",
      ),
    ).toBeNull();
    expect(parseAdvertisement("mensagem normal")).toBeNull();
  });
});
