import { apiUpload } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { whatsappEndpoints as ep } from "@/shared/config/endpoints";
import type { WhatsAppConnection } from "./types";

export const STATUS_MAX_PHOTOS = 20;
export const STATUS_MAX_CONTACTS = 100;
export const STATUS_MAX_BYTES = 8 * 1024 * 1024;
export const STATUS_PHOTO_FORMATS = "image/jpeg,image/png,image/webp";

export interface StatusItem {
  id: string;
  file: File;
  caption: string;
  unconfirmed?: boolean;
}

export class StatusPublishError extends Error {
  constructor(
    readonly code: string,
    readonly photoId: string,
  ) {
    super(code);
    this.name = "StatusPublishError";
  }
}

export function isStatusConnection(connection: WhatsAppConnection) {
  return (
    connection.status === "CONNECTED" &&
    connection.channel === "whatsapp" &&
    connection.provider?.toLowerCase() !== "wuzapi"
  );
}

export function mergeStatusFiles(current: StatusItem[], incoming: File[]) {
  const images = incoming.filter(
    (file) =>
      STATUS_PHOTO_FORMATS.split(",").includes(file.type) ||
      (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name)),
  );
  const sized = images.filter((file) => file.size > 0 && file.size <= STATUS_MAX_BYTES);
  const room = Math.max(0, STATUS_MAX_PHOTOS - current.length);
  const accepted = sized.slice(0, room).map((file) => ({
    file,
    caption: "",
    id: crypto.randomUUID(),
  }));
  return {
    items: [...current, ...accepted],
    rejectedNonImage: incoming.length - images.length,
    rejectedSize: images.length - sized.length,
    overflow: sized.length - accepted.length,
  };
}

export async function publishStatusBatch(
  whatsappId: number,
  contactIds: number[],
  items: StatusItem[],
  onProgress: (fraction: number) => void,
  onPublished: (photoId: string) => void,
) {
  for (const [index, item] of items.entries()) {
    const form = new FormData();
    form.append("file", item.file, item.file.name);
    form.append("caption", item.caption.trim());
    form.append("requestId", item.id);
    form.append("contactIds", JSON.stringify(contactIds));
    let result: { published?: number; id?: string; status?: string } | undefined;
    try {
      result = await apiUpload(ep.publishPhotoStatus(whatsappId), form, {
        onProgress: (fraction) => onProgress((index + fraction) / items.length),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status > 0 && error.status < 500) {
        const body = error.body as { error?: string; code?: string } | undefined;
        throw new StatusPublishError(body?.error || body?.code || "ERR_STATUS_INPUT", item.id);
      }
      throw new StatusPublishError("ERR_STATUS_UNCONFIRMED", item.id);
    }
    if (result?.published !== 1 || typeof result.id !== "string" || !result.id.trim()) {
      throw new StatusPublishError(
        result?.status === "rejected" ? "ERR_STATUS_REJECTED" : "ERR_STATUS_UNCONFIRMED",
        item.id,
      );
    }
    onPublished(item.id);
    onProgress((index + 1) / items.length);
  }
}
