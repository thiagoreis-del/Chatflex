import { apiUpload } from "@/shared/api/client";
import { whatsappEndpoints as ep } from "@/shared/config/endpoints";
import { normalizeUploadFile } from "@/shared/upload/pdf-file";

export const STATUS_MAX_PHOTOS = 20;

export interface StatusItem {
  file: File;
  caption: string;
}

export interface StatusPublishConfirmation {
  published: number;
}

type StatusResultRecord = {
  success?: unknown;
  sent?: unknown;
  published?: unknown;
  status?: unknown;
  error?: unknown;
  id?: unknown;
  key?: { id?: unknown } | null;
};

const positiveStatus = new Set(["sent", "published", "success", "ok"]);

function isConfirmedItem(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const item = value as StatusResultRecord;
  if (item.error) return false;
  if (item.success === true || item.sent === true || item.published === true) return true;
  if (typeof item.status === "string" && positiveStatus.has(item.status.toLowerCase())) return true;
  return typeof item.id === "string" || typeof item.key?.id === "string";
}

/**
 * Só aceita como sucesso respostas que comprovem quantos itens foram publicados.
 * Um HTTP 2xx vazio ou apenas `{ success: true }` significa upload aceito, não Status publicado.
 */
export function confirmStatusPublish(value: unknown, expected: number): StatusPublishConfirmation {
  if (!value || typeof value !== "object") throw new Error("STATUS_NOT_CONFIRMED");
  const response = value as Record<string, unknown>;
  const results = [response["results"], response["items"], response["data"]].find(Array.isArray) as
    unknown[] | undefined;
  if (results) {
    const published = results.filter(isConfirmedItem).length;
    if (results.length === expected && published === expected) return { published };
    throw new Error("STATUS_PARTIALLY_CONFIRMED");
  }

  const failed = typeof response["failed"] === "number" ? response["failed"] : 0;
  const published = [
    response["published"],
    response["sent"],
    response["successCount"],
    response["count"],
  ].find((count) => typeof count === "number");
  if (typeof published === "number" && published === expected && failed === 0) {
    return { published };
  }
  throw new Error("STATUS_NOT_CONFIRMED");
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

export async function publishStatusBatch(
  whatsappId: number,
  items: StatusItem[],
  onProgress?: (fraction: number) => void,
) {
  const form = new FormData();
  const files = await Promise.all(items.map((item) => normalizeUploadFile(item.file)));
  files.forEach((file) => form.append("file", file, file.name));
  form.append("captions", JSON.stringify(items.map((it) => it.caption.trim())));
  const response = await apiUpload<unknown>(
    ep.statusBatch(whatsappId),
    form,
    onProgress ? { onProgress } : {},
  );
  return confirmStatusPublish(response, items.length);
}
