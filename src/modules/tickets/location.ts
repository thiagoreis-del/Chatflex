export interface ParsedLocation {
  lat: number;
  lng: number;
  mapsUrl: string;
}

const MAPS_URL =
  /https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps\/?|maps\.google\.[a-z.]+\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)[^\s|]*/i;
const DEGREES =
  /degreesLatitude:\s*(-?\d+(?:\.\d+)?)[\s\S]*?degreesLongitude:\s*(-?\d+(?:\.\d+)?)/i;
const LATLNG = /(-?\d{1,2}\.\d{4,})\s*[,;]\s*(-?\d{1,3}\.\d{4,})/;
const DATA_IMAGE = /data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\r\n]+/i;

/** Detecta mensagem de localização compartilhada e extrai as coordenadas. */
export const parseLocation = (body: string | null | undefined): ParsedLocation | null => {
  if (!body) return null;
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
    if (coords?.[1] && coords[2]) return build(Number(coords[1]), Number(coords[2]));
  }
  return null;
};

/** Texto da mensagem sem o link de mapa — vazio quando a mensagem é só localização. */
export const locationText = (body: string | null | undefined): string => {
  if (!body) return "";
  if (DATA_IMAGE.test(body)) return "";
  const maps = MAPS_URL.exec(body);
  if (!maps) return "";
  return body.replace(maps[0], "").trim();
};

const build = (lat: number, lng: number): ParsedLocation | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` };
};
