import { isApiError } from "@/shared/api/errors";
import type { Queue, QueueInput } from "./types";

/** Only editable fields and known server settings; never send companyId or associations. */
export function queuePayload(input: QueueInput, existing?: Queue) {
  return {
    name: input.name.trim(),
    color: input.color,
    greetingMessage: input.greetingMessage.trim(),
    ativarRoteador: existing?.ativarRoteador ?? false,
    tempoRoteador: existing?.tempoRoteador ?? 0,
    orderQueue: existing?.orderQueue ?? null,
    outOfHoursMessage: existing?.outOfHoursMessage ?? "",
    schedules: existing?.schedules ?? [],
    integrationId: existing?.integrationId ?? null,
    fileListId: existing?.fileListId ?? null,
    closeTicket: existing?.closeTicket ?? false,
  };
}

export function queueErrorKey(error: unknown): string {
  if (!isApiError(error)) return "toast.error";
  const body = error.body as { error?: unknown; message?: unknown; code?: unknown } | undefined;
  const values = [body?.error, body?.message, body?.code].filter(
    (value): value is string => typeof value === "string",
  );
  const raw = values.join(" ");
  if (/número máximo de filas já alcançado/i.test(raw)) return "queues.form.limitReached";
  if (raw.includes("ERR_QUEUE_COLOR_ALREADY_EXISTS")) return "queues.form.colorTaken";
  if (raw.includes("ERR_QUEUE_NAME_ALREADY_EXISTS")) return "queues.form.nameTaken";
  if (raw.includes("ERR_QUEUE_INVALID_NAME")) return "queues.form.nameRequired";
  if (raw.includes("ERR_QUEUE_INVALID_COLOR")) return "queues.form.colorInvalid";
  return `errors:${error.messageKey}`;
}