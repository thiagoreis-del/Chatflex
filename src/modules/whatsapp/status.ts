import { queryOptions } from "@tanstack/react-query";
import { apiRequest, apiUpload } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { whatsappKeys } from "@/shared/api/query-keys";
import { whatsappEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { WhatsAppConnection } from "./types";

export const STATUS_MAX_PHOTOS = 20;
export const STATUS_MAX_BYTES = 8 * 1024 * 1024;
export const STATUS_PHOTO_FORMATS = "image/jpeg,image/png,image/webp";

export interface StatusItem {
  id: string;
  file: File;
  caption: string;
  unconfirmed?: "send" | "schedule";
}

export interface StatusSchedule {
  id: string;
  filename: string;
  caption: string;
  publishAt: string;
  status: "scheduled" | "sending" | "published" | "failed" | "unconfirmed" | "cancelled";
  errorCode: string | null;
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
  return connection.channel === "whatsapp" && connection.provider?.toLowerCase() !== "wuzapi";
}

export function localStatusDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function statusSchedulesQuery(whatsappId: number, day: string) {
  return queryOptions({
    queryKey: whatsappKeys.statusSchedules(whatsappId, day),
    queryFn: ({ signal }) => {
      const from = new Date(`${day}T00:00:00`);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return apiRequest<{ schedules: StatusSchedule[] }>(
        withQuery(ep.statusSchedules(whatsappId), {
          from: from.toISOString(),
          to: to.toISOString(),
        }),
        { signal },
      );
    },
    enabled: Boolean(whatsappId && day),
    refetchInterval: 30_000,
  });
}

export const cancelStatusSchedule = (whatsappId: number, scheduleId: string) =>
  apiRequest<void>(ep.statusSchedule(whatsappId, scheduleId), { method: "DELETE" });

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
  items: StatusItem[],
  onProgress: (fraction: number) => void,
  onPublished: (photoId: string) => void,
  publishAt?: string,
) {
  for (const [index, item] of items.entries()) {
    const form = new FormData();
    form.append("file", item.file, item.file.name);
    form.append("caption", item.caption.trim());
    form.append("requestId", item.id);
    if (publishAt) form.append("publishAt", publishAt);
    let result:
      { published?: number; scheduled?: number; id?: string; status?: string } | undefined;
    try {
      result = await apiUpload(ep.publishPhotoStatus(whatsappId), form, {
        onProgress: (fraction) => onProgress((index + fraction) / items.length),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status > 0 && error.status < 500) {
        const body = error.body as { error?: string; code?: string } | undefined;
        throw new StatusPublishError(body?.error || body?.code || "ERR_STATUS_INPUT", item.id);
      }
      throw new StatusPublishError(
        publishAt ? "ERR_STATUS_SCHEDULE_UNCONFIRMED" : "ERR_STATUS_UNCONFIRMED",
        item.id,
      );
    }
    const confirmed = publishAt ? result?.scheduled === 1 : result?.published === 1;
    if (!confirmed || typeof result?.id !== "string" || !result.id.trim()) {
      throw new StatusPublishError(
        publishAt
          ? "ERR_STATUS_SCHEDULE_UNCONFIRMED"
          : result?.status === "rejected"
            ? "ERR_STATUS_REJECTED"
            : "ERR_STATUS_UNCONFIRMED",
        item.id,
      );
    }
    onPublished(item.id);
    onProgress((index + 1) / items.length);
  }
}
