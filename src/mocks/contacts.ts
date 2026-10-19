import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Contact, ContactInput } from "@/modules/contacts/types";
import type { Paginated } from "@/shared/types/pagination";

let seq = 9;
const db: Contact[] = [
  {
    id: 1,
    name: "Ana Souza",
    number: "5511987650001",
    email: "ana@exemplo.com",
    tags: ["cliente", "vip"],
  },
  { id: 2, name: "Bruno Lima", number: "5511987650002", email: null, tags: ["lead"] },
  {
    id: 3,
    name: "Carla Mendes",
    number: "5511987650003",
    email: "carla@exemplo.com",
    tags: ["cliente"],
  },
  { id: 4, name: "Diego Ramos", number: "5511987650004", email: null, tags: [] },
  {
    id: 5,
    name: "Elisa Prado",
    number: "5511987650005",
    email: "elisa@exemplo.com",
    tags: ["fornecedor"],
  },
  { id: 6, name: "Fábio Nunes", number: "5511987650006", email: null, tags: ["lead"] },
  {
    id: 7,
    name: "Gabriela Reis",
    number: "5511987650007",
    email: "gabi@exemplo.com",
    tags: ["cliente"],
  },
  { id: 8, name: "Henrique Alves", number: "5511987650008", email: null, tags: [] },
];

const PAGE_SIZE = 8;

export function contactsMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";
  const body = opts.body as ContactInput | undefined;

  if (path.startsWith("/contacts?") || path === "/contacts") {
    const url = new URL(path, "http://mock");
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));

    if (method === "POST" && !path.includes("?")) {
      const item: Contact = { id: seq++, ...body! };
      db.push(item);
      return item;
    }

    const filtered = search
      ? db.filter((c) =>
          [c.name, c.number, c.email ?? ""].some((v) => v.toLowerCase().includes(search)),
        )
      : db;
    const start = (page - 1) * PAGE_SIZE;
    const result: Paginated<Contact> = {
      data: filtered.slice(start, start + PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: filtered.length,
    };
    return result;
  }

  const m = path.match(/^\/contacts\/(\d+)$/);
  const item = m ? db.find((c) => c.id === Number(m[1])) : undefined;
  if (!m || !item) throw new ApiError("notFound", 404);
  if (method === "GET") return item;
  if (method === "PUT") return Object.assign(item, body);
  db.splice(db.indexOf(item), 1);
  return undefined;
}

/** Usado pelo mock de atendimento ao iniciar uma conversa. */
export function contactSummary(id: number) {
  const c = db.find((x) => x.id === id);
  return { id, name: c?.name ?? "", number: c?.number ?? "" };
}
