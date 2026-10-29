import { describe, expect, it } from "vitest";
import { mergeMessagePages } from "@/modules/tickets/api";
import type { Message } from "@/modules/tickets/types";

const message = (id: string, createdAt: string, body = id): Message => ({
  id,
  ticketId: 10,
  body,
  fromMe: false,
  createdAt,
});

describe("ticket message history", () => {
  it("combina páginas recentes e antigas em ordem cronológica", () => {
    const recent = [
      message("3", "2026-10-29T12:00:00.000Z"),
      message("4", "2026-10-29T13:00:00.000Z"),
    ];
    const old = [
      message("1", "2026-10-28T08:00:00.000Z"),
      message("2", "2026-10-28T09:00:00.000Z"),
    ];

    expect(mergeMessagePages([recent, old]).map((item) => item.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("remove mensagens repetidas na borda da paginação", () => {
    const first = message("2", "2026-10-29T10:00:00.000Z", "primeira versão");
    const repeated = message("2", "2026-10-29T10:00:00.000Z", "versão atualizada");

    expect(
      mergeMessagePages([
        [first, message("3", "2026-10-29T11:00:00.000Z")],
        [message("1", "2026-10-29T09:00:00.000Z"), repeated],
      ]),
    ).toEqual([
      message("1", "2026-10-29T09:00:00.000Z"),
      repeated,
      message("3", "2026-10-29T11:00:00.000Z"),
    ]);
  });

  it("ignora mensagens sem id em vez de derrubar a conversa", () => {
    const broken = { ...message("x", "2026-10-29T10:00:00.000Z"), id: undefined } as unknown as Message;
    const nulo = { ...message("y", "2026-10-29T11:00:00.000Z"), id: null } as unknown as Message;

    expect(
      mergeMessagePages([
        [broken, message("2", "2026-10-29T12:00:00.000Z")],
        [message("1", "2026-10-29T09:00:00.000Z"), nulo],
      ]).map((item) => item.id),
    ).toEqual(["1", "2"]);
  });
});