export interface ParsedLocation {
  lat: number;
  lng: number;
  mapsUrl: string;
}

const MAPS_URL = /https?:\/\/(?:www\.)?(?:maps\.google\.[a-z.]+\/[^\s]*[?&]q=|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)([^\s&]+)/i;
const DEGREES = /degreesLatitude:\s*(-?\d+(?:\.\d+)?)[\s\S]*?degreesLongitude:\s*(-?\d+(?:\.\d+)?)/i;
const LATLNG = /(-?\d{1,2}\.\d{4,})\s*[,;]\s*(-?\d{1,3}\.\d{4,})/;

/** Detecta mensagem de localização compartilhada e extrai as coordenadas. */
export const parseLocation = (body: string | null | undefined): ParsedLocation | null => {
  if (!body) return null;
  const degrees = DEGREES.exec(body);
  if (degrees) return build(Number(degrees[1]), Number(degrees[2]));
  const maps = MAPS_URL.exec(body);
  if (maps) {
    const coords = LATLNG.exec(maps[1]);
    if (coords) return build(Number(coords[1]), Number(coords[2]));
    return { lat: 0, lng: 0, mapsUrl: maps[0] };
  }
  return null;
};

const build = (lat: number, lng: number): ParsedLocation | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` };
};
