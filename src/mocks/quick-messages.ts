import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { QuickMessage, QuickMessageInput } from "@/modules/quick-messages/types";

let seq = 6;
const items: QuickMessage[] = [
  { id: 1, shortcode: "ola", message: "Olá! Tudo bem? Como posso ajudar?", geral: true },
  { id: 2, shortcode: "pix", message: "Nossa chave PIX é o CNPJ 00.000.000/0001-00 (exemplo).", geral: true },
  { id: 3, shortcode: "horario", message: "Atendemos de segunda a sexta, das 8h às 18h.", geral: true },
  { id: 4, shortcode: "espera", message: "Só um instante, estou verificando para você.", geral: false },
  { id: 5, shortcode: "encerramento", message: "Obrigado pelo contato! Qualquer dúvida, estamos à disposição.", geral: true },
];

export function quickMessagesMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";
  if (path === "/quick-messages/list") return items;
  if (path === "/quick-messages" && method === "POST") {
    const body = opts.body as QuickMessageInput;
    if (items.some((i) => i.shortcode === body.shortcode)) throw new ApiError("conflict", 409);
    const q = { id: seq++, ...body };
    items.push(q);
    return q;
  }
  const m = path.match(/^\/quick-messages\/(\d+)$/);
  if (m) {
    const q = items.find((x) => x.id === Number(m[1]));
    if (!q) throw new ApiError("notFound", 404);
    if (method === "PUT") return Object.assign(q, opts.body as QuickMessageInput);
    if (method === "DELETE") {
      items.splice(items.indexOf(q), 1);
      return undefined;
    }
    return q;
  }
  throw new ApiError("notFound", 404);
}
