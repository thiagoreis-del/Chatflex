import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { WhatsAppConnection, WhatsAppInput } from "@/modules/whatsapp/types";
import type { StatusSchedule } from "@/modules/whatsapp/status";

let seq = 3;
const polls = new Map<number, number>();
const agenda = new Map<
  string,
  StatusSchedule & { connectionId: number; photo: Blob; reused: boolean }
>();
const db: WhatsAppConnection[] = [
  {
    id: 1,
    name: "Comercial",
    status: "CONNECTED",
    channel: "whatsapp",
    number: "5511900000001",
    isDefault: true,
    greetingMessage: "Olá! Como podemos ajudar?",
  },
  {
    id: 2,
    name: "Suporte",
    status: "DISCONNECTED",
    number: null,
    isDefault: false,
    greetingMessage: "",
  },
];

export function whatsappMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";
  const body = opts.body as WhatsAppInput | undefined;
  if (path === "/whatsapp") {
    if (method === "GET") return db;
    const item: WhatsAppConnection = {
      id: seq++,
      status: "DISCONNECTED",
      channel: "whatsapp",
      number: null,
      ...body!,
    };
    if (item.isDefault) db.forEach((c) => (c.isDefault = false));
    db.push(item);
    return item;
  }
  const url = new URL(path, "http://mock");
  const dashboard = url.pathname.match(/^\/whatsapp\/(\d+)\/status\/dashboard$/);
  if (dashboard && method === "GET") {
    const all = [...agenda.values()].filter((entry) => entry.connectionId === Number(dashboard[1]));
    const online = all.filter(
      (entry) => entry.status === "published" && new Date(entry.expiresAt!) > new Date(),
    );
    const scheduled = all.filter((entry) => entry.status === "scheduled");
    const library = all.filter((entry) => !entry.reused);
    const views = { online, scheduled, library, history: all };
    const view = url.searchParams.get("view") as keyof typeof views;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const items = (views[view] ?? all).filter(
      (entry) => !from || !to || (entry.publishAt >= from && entry.publishAt < to),
    );
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = 12;
    const entries = items
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ photo, ...entry }) => ({ ...entry, hasPhoto: photo.size > 0 }));
    return {
      entries,
      page,
      pageSize,
      total: items.length,
      counts: { online: online.length, scheduled: scheduled.length, library: library.length },
    };
  }
  const stored = url.pathname.match(
    /^\/whatsapp\/(\d+)\/status\/schedules\/([\w-]+)\/(photo|published)$/,
  );
  if (stored) {
    const entry = agenda.get(stored[2]!);
    if (!entry || entry.connectionId !== Number(stored[1])) throw new ApiError("notFound", 404);
    if (stored[3] === "photo" && method === "GET") return entry.photo;
    if (stored[3] === "published" && method === "DELETE" && entry.canRemove) {
      entry.status = "removed";
      entry.canRemove = false;
      return undefined;
    }
    throw new ApiError("conflict", 409);
  }
  const agendaPath = url.pathname.match(/^\/whatsapp\/(\d+)\/status\/schedules(?:\/([\w-]+))?$/);
  if (agendaPath) {
    const connectionId = Number(agendaPath[1]);
    if (method === "GET") {
      const from = url.searchParams.get("from") ?? "";
      const to = url.searchParams.get("to") ?? "";
      return {
        schedules: [...agenda.values()].filter(
          (entry) =>
            entry.connectionId === connectionId && entry.publishAt >= from && entry.publishAt < to,
        ),
      };
    }
    const entry = agenda.get(agendaPath[2] ?? "");
    if (entry?.connectionId !== connectionId || entry.status !== "scheduled") {
      throw new ApiError("conflict", 409);
    }
    entry.status = "cancelled";
    return undefined;
  }
  const status = path.match(/^\/whatsapp\/(\d+)\/status$/);
  if (status && method === "POST") {
    const connection = db.find((entry) => entry.id === Number(status[1]));
    const form = opts.body;
    const publishAt = form instanceof FormData ? form.get("publishAt") : null;
    if (connection && form instanceof FormData) {
      const id = String(form.get("requestId"));
      const file = form.get("file");
      const source = agenda.get(String(form.get("sourceId")));
      if (source && source.connectionId !== connection.id) throw new ApiError("notFound", 404);
      const photo = file instanceof File ? file : source?.photo;
      if (!photo) throw new ApiError("notFound", 404);
      const scheduled = typeof publishAt === "string";
      if (!scheduled && connection.status !== "CONNECTED") {
        throw new ApiError("conflict", 409, { code: "ERR_STATUS_DISCONNECTED" });
      }
      const now = new Date().toISOString();
      agenda.set(id, {
        id,
        connectionId: connection.id,
        publishAt: scheduled ? publishAt : now,
        publishedAt: scheduled ? null : now,
        expiresAt: scheduled ? null : new Date(Date.now() + 86400000).toISOString(),
        filename: file instanceof File ? file.name : (source?.filename ?? "status.jpg"),
        caption: String(form.get("caption") ?? ""),
        status: scheduled ? "scheduled" : "published",
        errorCode: null,
        hasPhoto: true,
        canRemove: !scheduled,
        photo,
        reused: Boolean(source),
      });
      return scheduled ? { scheduled: 1, id } : { published: 1, id };
    }
    throw new ApiError("notFound", 404);
  }
  const m = path.match(/^\/(whatsapp|whatsappsession)\/(\d+)(?:\?.*)?$/);
  const item = m ? db.find((c) => c.id === Number(m[2])) : undefined;
  if (!m || !item) throw new ApiError("notFound", 404);
  if (m[1] === "whatsapp") {
    if (method === "GET") {
      if (item.status === "qrcode") {
        const n = (polls.get(item.id) ?? 0) + 1;
        polls.set(item.id, n);
        if (n >= 4)
          Object.assign(item, { status: "CONNECTED", qrcode: null, number: "5511900000099" });
      }
      return item;
    }
    if (method === "PUT") {
      if (body?.isDefault) db.forEach((c) => (c.isDefault = false));
      return Object.assign(item, body);
    }
    db.splice(db.indexOf(item), 1);
    return undefined;
  }
  if (method === "DELETE")
    Object.assign(item, { status: "DISCONNECTED", qrcode: null, number: null });
  else {
    polls.set(item.id, 0);
    Object.assign(item, { status: "qrcode", qrcode: `demo-qr-${item.id}-${Date.now()}` });
  }
  return undefined;
}
