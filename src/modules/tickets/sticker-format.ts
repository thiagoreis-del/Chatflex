/** Tamanho padrão de figurinha do WhatsApp (512x512, WebP, fundo transparente). */
export const STICKER_SIZE = 512;

/** Converte qualquer imagem em WebP 512x512 centralizada, preservando a proporção. */
export async function toStickerWebp(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  const scale = Math.min(STICKER_SIZE / bitmap.width, STICKER_SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (STICKER_SIZE - w) / 2, (STICKER_SIZE - h) / 2, w, h);
  bitmap.close();
  return new Promise((resolve) =>
    canvas.toBlob((out) => resolve(out ?? blob), "image/webp", 0.9),
  );
}
