import { describe, expect, it } from "vitest";
import { parseLocation } from "@/modules/tickets/location";

describe("location", () => {
  it("extrai coordenadas do formato degreesLatitude/degreesLongitude", () => {
    const body = "degreesLatitude: -26.9123\ndegreesLongitude: -49.0712";
    expect(parseLocation(body)).toEqual({
      lat: -26.9123,
      lng: -49.0712,
      mapsUrl: "https://www.google.com/maps?q=-26.9123,-49.0712",
    });
  });

  it("extrai coordenadas de link do Google Maps", () => {
    const body = "https://maps.google.com/?q=-26.9123,-49.0712";
    expect(parseLocation(body)?.mapsUrl).toBe(
      "https://www.google.com/maps?q=-26.9123,-49.0712",
    );
  });

  it("mantém link encurtado mesmo sem coordenadas", () => {
    const body = "https://maps.app.goo.gl/abc123";
    expect(parseLocation(body)?.mapsUrl).toBe("https://maps.app.goo.gl/abc123");
  });

  it("rejeita coordenadas inválidas e texto comum", () => {
    expect(parseLocation("degreesLatitude: 999\ndegreesLongitude: 0")).toBeNull();
    expect(parseLocation("mensagem normal")).toBeNull();
    expect(parseLocation(null)).toBeNull();
  });
});
