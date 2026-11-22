import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { WhatsAppConnection, WhatsAppInput } from "@/modules/whatsapp/types";

let seq = 3;
const polls = new Map<number, number>();
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
  const status = path.match(/^\/whatsapp\/(\d+)\/status$/);
  if (status && method === "POST") {
    const connection = db.find((entry) => entry.id === Number(status[1]));
    if (connection?.status !== "CONNECTED") {
      throw new ApiError("conflict", 409, { code: "ERR_STATUS_DISCONNECTED" });
    }
    return { published: 1, id: crypto.randomUUID() };
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
