export interface ParsedLocation {
  lat: number;
  lng: number;
  mapsUrl: string;
  thumbnailUrl?: string;
  name?: string;
  address?: string;
}

const MAPS_URL =
  /https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps\/?|maps\.google\.[a-z.]+\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)[^\s|]*/i;
const DEGREES =
  /degreesLatitude:\s*(-?\d+(?:\.\d+)?)[\s\S]*?degreesLongitude:\s*(-?\d+(?:\.\d+)?)/i;
const LATLNG = /(-?\d{1,2}\.\d{4,})\s*[,;]\s*(-?\d{1,3}\.\d{4,})/;
const DATA_IMAGE = /data:image\/[a-z0-9.+-]+;base64,\s*[a-z0-9+/=\r\n]+/i;

const normalizedDataImage = (value: string): string | undefined => {
  const match = DATA_IMAGE.exec(value);
  return match?.[0].replace(/;base64,\s*/i, ";base64,").replace(/[\r\n]/g, "");
};

/** Detecta mensagem de localização compartilhada e extrai as coordenadas. */
export const parseLocation = (body: string | null | undefined): ParsedLocation | null => {
  if (!body) return null;
  const pipeParts = body.split("|").map((part) => part.trim());
  const thumbnailUrl = normalizedDataImage(pipeParts[0] || "");
  const pipeMapsUrl = pipeParts.find((part) => MAPS_URL.test(part));
  const pipeCoords = pipeParts
    .map((part) => LATLNG.exec(part))
    .find((match) => Boolean(match?.[1] && match[2]));
  if (body.includes("|") && pipeMapsUrl && pipeCoords?.[1] && pipeCoords[2]) {
    const parsed = build(Number(pipeCoords[1]), Number(pipeCoords[2]));
    if (!parsed) return null;
    return {
      ...parsed,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(pipeParts[3] ? { name: pipeParts[3] } : {}),
      ...(pipeParts[4] ? { address: pipeParts[4] } : {}),
    };
  }
  const degrees = DEGREES.exec(body);
  if (degrees) return build(Number(degrees[1]), Number(degrees[2]));
  const maps = MAPS_URL.exec(body);
  if (maps) {
    let decodedUrl = maps[0];
    try {
      decodedUrl = decodeURIComponent(decodedUrl);
    } catch {
      // URL malformada ainda pode ser aberta; apenas não decodifica coordenadas.
    }
    const coords = LATLNG.exec(decodedUrl);
    if (coords?.[1] && coords[2]) return build(Number(coords[1]), Number(coords[2]));
    return { lat: 0, lng: 0, mapsUrl: maps[0] };
  }
  // Algumas versões do backend serializam a miniatura Base64 seguida das
  // coordenadas. A miniatura nunca deve aparecer como texto na conversa.
  if (DATA_IMAGE.test(body)) {
    const coords = LATLNG.exec(body);
    if (coords?.[1] && coords[2]) {
      const parsed = build(Number(coords[1]), Number(coords[2]));
      return parsed && thumbnailUrl ? { ...parsed, thumbnailUrl } : parsed;
    }
  }
  return null;
};

/** Texto da mensagem sem o link de mapa — vazio quando a mensagem é só localização. */
export const locationText = (body: string | null | undefined): string => {
  if (!body) return "";
  if (DATA_IMAGE.test(body)) {
    const parsed = parseLocation(body);
    return [parsed?.name, parsed?.address].filter(Boolean).join("\n");
  }
  const maps = MAPS_URL.exec(body);
  if (!maps) return "";
  return body.replace(maps[0], "").trim();
};

const build = (lat: number, lng: number): ParsedLocation | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` };
};
