import { apiUpload } from "@/shared/api/client";
import { whatsappEndpoints as ep } from "@/shared/config/endpoints";

export const STATUS_MAX_PHOTOS = 20;

export interface StatusItem {
  file: File;
  caption: string;
}

/** Mantém só imagens e respeita o limite de 20 fotos por lote. */
export function mergeStatusFiles(current: StatusItem[], incoming: File[]) {
  const images = incoming.filter((f) => f.type.startsWith("image/"));
  const room = Math.max(0, STATUS_MAX_PHOTOS - current.length);
  const accepted = images.slice(0, room).map((file) => ({ file, caption: "" }));
  return {
    items: [...current, ...accepted],
    rejectedNonImage: incoming.length - images.length,
    overflow: images.length - accepted.length,
  };
}

export function publishStatusBatch(
  whatsappId: number,
  items: StatusItem[],
  onProgress?: (fraction: number) => void,
) {
  const form = new FormData();
  items.forEach((it) => form.append("file", it.file, it.file.name));
  form.append("captions", JSON.stringify(items.map((it) => it.caption.trim())));
  return apiUpload<unknown>(ep.statusBatch(whatsappId), form, { onProgress });
}
