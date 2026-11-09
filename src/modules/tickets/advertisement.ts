export interface ParsedAdvertisement {
  thumbnailUrl?: string;
  sourceUrl?: string;
  title?: string;
  description?: string;
  message: string;
}

const DATA_IMAGE = /^data:image\/[a-z0-9.+-]+;base64,\s*[a-z0-9+/=\r\n]+$/i;
const URL = /^https?:\/\//i;

const normalizeThumbnail = (value: string): string | undefined => {
  if (!DATA_IMAGE.test(value)) return undefined;
  return value.replace(/;base64,\s*/i, ";base64,").replace(/[\r\n]/g, "");
};

/** Decodifica o formato legado do backend: miniatura | link | título | descrição | mensagem. */
export const parseAdvertisement = (body: string | null | undefined): ParsedAdvertisement | null => {
  if (!body?.trim()) return null;
  const parts = body
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const thumbnailUrl = normalizeThumbnail(parts[0] || "");
  if (!thumbnailUrl || parts.length < 2) return null;

  const content = parts.slice(1);
  const sourceIndex = content.findIndex((part) => URL.test(part));
  const sourceUrl = sourceIndex >= 0 ? content.splice(sourceIndex, 1)[0] : undefined;
  if (
    !sourceUrl ||
    /(?:google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl)/i.test(sourceUrl)
  ) {
    return null;
  }

  const title = content.shift();
  const description = content.length > 1 ? content.shift() : undefined;
  const message = content.join(" | ").trim();
  if (!message && !title && !description) return null;

  return {
    thumbnailUrl,
    sourceUrl,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    message,
  };
};
