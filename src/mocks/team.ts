import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Queue, QueueInput } from "@/modules/queues/types";
import type { CompanyUser, CompanyUserInput } from "@/modules/users/types";
import type { Paginated } from "@/shared/types/pagination";

let queueSeq = 4;
const queues: Queue[] = [
  { id: 1, name: "Comercial", color: "#2563EB", greetingMessage: "Olá! Em que podemos ajudar?" },
  { id: 2, name: "Suporte", color: "#16A34A", greetingMessage: "Bem-vindo ao suporte." },
  { id: 3, name: "Financeiro", color: "#F59E0B", greetingMessage: null },
];

let userSeq = 5;
const users: CompanyUser[] = [
  { id: 1, name: "Pessoa Demonstração", email: "demo@exemplo.test", profile: "admin", queueIds: [1, 2, 3] },
  { id: 2, name: "Marina Costa", email: "marina@exemplo.test", profile: "user", queueIds: [1] },
  { id: 3, name: "Rafael Torres", email: "rafael@exemplo.test", profile: "user", queueIds: [2] },
  { id: 4, name: "Júlia Martins", email: "julia@exemplo.test", profile: "user", queueIds: [2, 3] },
];

const PAGE_SIZE = 8;
const strip = ({ password: _p, ...rest }: CompanyUserInput) => rest;

export function teamMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";

  if (path === "/queue") {
    if (method === "POST") {
      const q: Queue = { id: queueSeq++, ...(opts.body as QueueInput) };
      queues.push(q);
      return q;
    }
    return queues;
  }
  const qm = path.match(/^\/queue\/(\d+)$/);
  if (qm) {
    const q = queues.find((x) => x.id === Number(qm[1]));
    if (!q) throw new ApiError("notFound", 404);
    if (method === "PUT") return Object.assign(q, opts.body as QueueInput);
    if (method === "DELETE") {
      queues.splice(queues.indexOf(q), 1);
      users.forEach((u) => (u.queueIds = u.queueIds.filter((id) => id !== q.id)));
      return undefined;
    }
    return q;
  }

  if (path === "/users" || path.startsWith("/users?")) {
    if (method === "POST") {
      const body = opts.body as CompanyUserInput;
      if (users.some((u) => u.email.toLowerCase() === body.email.toLowerCase()))
        throw new ApiError("conflict", 409);
      const u: CompanyUser = { id: userSeq++, ...strip(body) };
      users.push(u);
      return u;
    }
    const url = new URL(path, "http://mock");
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const filtered = search
      ? users.filter((u) => [u.name, u.email].some((v) => v.toLowerCase().includes(search)))
      : users;
    const start = (page - 1) * PAGE_SIZE;
    const result: Paginated<CompanyUser> = {
      data: filtered.slice(start, start + PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: filtered.length,
    };
    return result;
  }
  const um = path.match(/^\/users\/(\d+)$/);
  const u = um ? users.find((x) => x.id === Number(um[1])) : undefined;
  if (!u) throw new ApiError("notFound", 404);
  if (method === "PUT") return Object.assign(u, strip(opts.body as CompanyUserInput));
  if (method === "DELETE") {
    users.splice(users.indexOf(u), 1);
    return undefined;
  }
  return u;
}
