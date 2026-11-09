import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  conversationFromRecord,
  conversationPayload,
  messageFromRecord,
} from "@/modules/internal-chat/adapter";
import {
  createInternalConversation,
  deleteInternalConversation,
  internalConversationsQuery,
  internalMessagesQuery,
  markInternalConversationRead,
  mergeInternalMessages,
  sendInternalMedia,
  sendInternalMessage,
} from "@/modules/internal-chat/api";
import { apiRequest, apiUpload } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn(), apiUpload: vi.fn() }));
vi.mock("@/shared/auth/session-store", () => ({
  sessionStore: { get: () => ({ user: { id: "7", companyId: "2" } }) },
}));

const record = {
  id: 12,
  ownerId: 7,
  companyId: 2,
  title: "Equipe",
  updatedAt: "2026-11-03T22:00:00Z",
  users: [
    { userId: 7, unreads: 3, user: { id: 7, name: "Bruno" } },
    { userId: 3, user: { id: 3, name: "Thiago" } },
  ],
};

describe("verified internal chat contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a group with title and user objects, without repeating its owner", async () => {
    vi.mocked(apiRequest).mockResolvedValue(record);
    const created = await createInternalConversation({
      kind: "group",
      name: " Equipe ",
      userIds: [7, 3, 3],
    });
    expect(apiRequest).toHaveBeenCalledWith("/chats", {
      method: "POST",
      body: { title: "Equipe", users: [{ id: 3 }] },
    });
    expect(created.participants).toEqual([
      { id: 7, name: "Bruno" },
      { id: 3, name: "Thiago" },
    ]);
  });

  it("does not invent a queue conversation contract", () => {
    expect(() => conversationPayload({ kind: "queue", queueId: 2, userIds: [] }, 7)).toThrow();
  });

  it("reads unreads only for the authenticated user", () => {
    expect(conversationFromRecord(record, 7).unreadMessages).toBe(3);
    expect(conversationFromRecord(record, 3).unreadMessages).toBe(0);
  });

  it("normalizes string ids and unread counters returned for administrators", () => {
    const adminRecord = {
      ...record,
      users: [{ userId: "7", unreads: "4", user: { id: "7", name: "Bruno" } }],
    };
    expect(conversationFromRecord(adminRecord, 7).unreadMessages).toBe(4);
  });

  it("deletes a conversation through the verified chat detail route", async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);
    await deleteInternalConversation(12);
    expect(apiRequest).toHaveBeenCalledWith("/chats/12", { method: "DELETE" });
  });

  it("maps message text and identifies the real sender", () => {
    const message = {
      id: 22,
      chatId: 12,
      senderId: 3,
      message: "Olá",
      createdAt: record.updatedAt,
    };
    expect(messageFromRecord(message, 7)).toMatchObject({ id: "22", body: "Olá", fromMe: false });
    expect(messageFromRecord(message, 3).fromMe).toBe(true);
  });

  it("sends text in the message field", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      id: 22,
      chatId: 12,
      senderId: 7,
      message: "Olá",
      createdAt: record.updatedAt,
    });
    expect((await sendInternalMessage(12, "Olá")).fromMe).toBe(true);
    expect(apiRequest).toHaveBeenCalledWith("/chats/12/messages", {
      method: "POST",
      body: { message: "Olá" },
    });
  });

  it("marks the selected conversation as read through the verified route", async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);
    await markInternalConversationRead(12);
    expect(apiRequest).toHaveBeenCalledWith("/chats/12/read", {
      method: "POST",
      body: {},
    });
  });

  it("merges refreshed messages without removing older history", () => {
    const oldMessage = messageFromRecord(
      { id: 1, chatId: 12, senderId: 3, message: "Antiga", createdAt: "2026-11-01T10:00:00Z" },
      7,
    );
    const newMessage = messageFromRecord(
      { id: 2, chatId: 12, senderId: 7, message: "Nova", createdAt: "2026-11-01T10:01:00Z" },
      7,
    );
    expect(mergeInternalMessages([oldMessage], [newMessage])).toEqual([oldMessage, newMessage]);
  });

  it("loads every message page when the conversation cache is empty", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        records: [
          { id: 2, chatId: 12, senderId: 7, message: "Nova", createdAt: "2026-11-01T10:01:00Z" },
        ],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        records: [
          { id: 1, chatId: 12, senderId: 3, message: "Antiga", createdAt: "2026-11-01T10:00:00Z" },
        ],
        hasMore: false,
      });
    const query = internalMessagesQuery(12).queryFn;
    if (typeof query !== "function") throw new Error("Missing query function");
    const result = await query({
      signal: new AbortController().signal,
      client: { getQueryData: () => undefined },
    } as never);
    expect(result.map((message) => message.id)).toEqual(["1", "2"]);
    expect(apiRequest).toHaveBeenCalledWith("/chats/12/messages?pageNumber=2", expect.any(Object));
  });

  it("resolves uploaded voice notes in the session company's folder", async () => {
    vi.mocked(apiUpload).mockResolvedValue({
      id: 24,
      chatId: 12,
      senderId: 7,
      message: "",
      createdAt: record.updatedAt,
      mediaPath: "1793744307471_audio.ogg",
      mediaName: "audio.ogg",
    });
    const message = await sendInternalMedia(
      12,
      new File(["audio"], "audio.ogg", { type: "audio/ogg" }),
      "",
    );
    expect(message.mediaUrl).toBe(
      "https://api.notasflex.com.br/public/company2/1793744307471_audio.ogg",
    );
    expect(message.mediaType).toBe("audio");
  });

  it("does not resolve filenames outside the authenticated company folder", () => {
    const base = { id: 24, chatId: 12, senderId: 7, message: "", createdAt: record.updatedAt };
    expect(
      messageFromRecord({ ...base, mediaPath: "../company4/audio.ogg" }, 7, 2).mediaUrl,
    ).toBeNull();
    expect(messageFromRecord({ ...base, mediaPath: "audio.ogg" }, 7).mediaUrl).toBeNull();
  });

  it("uploads a PDF under file and sends its caption under message", async () => {
    vi.mocked(apiUpload).mockResolvedValue({
      id: 23,
      chatId: 12,
      senderId: 7,
      message: "Contrato",
      createdAt: record.updatedAt,
    });
    await sendInternalMedia(
      12,
      new File(["%PDF-1.7"], "contrato", { type: "application/octet-stream" }),
      "Contrato",
    );
    const call = vi.mocked(apiUpload).mock.calls[0];
    if (!call) throw new Error("Missing upload");
    const [url, form] = call;
    expect(url).toBe("/chats/12/messages");
    expect(form.get("message")).toBe("Contrato");
    expect((form.get("file") as File).name).toBe("contrato.pdf");
    expect(form.has("medias")).toBe(false);
  });

  it("paginates conversations and excludes explicit foreign-company records", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        records: [record, { ...record, id: 13, companyId: 4 }],
        hasMore: true,
      })
      .mockResolvedValueOnce({ records: [{ ...record, id: 14 }], hasMore: false });
    const options = internalConversationsQuery("2");
    const query = options.queryFn;
    if (typeof query !== "function") throw new Error("Missing query function");
    const result = await query({ signal: new AbortController().signal } as Parameters<
      typeof query
    >[0]);
    expect(result.map((chat) => chat.id)).toEqual([12, 14]);
    expect(apiRequest).toHaveBeenCalledWith("/chats?pageNumber=2", expect.any(Object));
  });
});
