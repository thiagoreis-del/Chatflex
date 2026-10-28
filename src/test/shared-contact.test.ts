import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ tickets: vi.fn(), contacts: vi.fn(), createContact: vi.fn(), createTicket: vi.fn() }));
vi.mock("@/modules/contacts/api", () => ({
  contactsQuery: (filters: { page: number }) => ({ queryKey: ["contacts", filters], queryFn: () => mocks.contacts(filters) }),
  createContact: mocks.createContact,
}));
vi.mock("@/modules/tickets/api", () => ({
  ticketsQuery: (filters: { status: string }) => ({ queryKey: ["tickets", filters], queryFn: () => mocks.tickets(filters) }),
  createTicket: mocks.createTicket,
}));
import { sharedContactNumber, startSharedContactConversation } from "@/modules/tickets/shared-contact";
const card = { name: "Maria", phone: "+55 (11) 98765-4321" };
const existing = { id: 42, status: "pending", contact: { id: 8, name: "Maria", number: "5511987654321" }, whatsapp: { id: 2 } };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.tickets.mockResolvedValue([]);
  mocks.contacts.mockResolvedValue({ data: [], total: 0, pageSize: 20 });
  mocks.createContact.mockResolvedValue(existing.contact);
  mocks.createTicket.mockResolvedValue({ ...existing, status: "open" });
});
describe("shared contact conversations", () => {
  it("normalizes phone punctuation without adding a country code", () => {
    expect(sharedContactNumber(card.phone)).toBe("5511987654321");
    expect(sharedContactNumber("11987654321")).toBe("11987654321");
  });
  it("rejects missing or invalid numbers without requesting a ticket", async () => {
    await expect(startSharedContactConversation({ name: "Maria", phone: null }, 2, 7)).rejects.toThrow();
    expect(sharedContactNumber("https://example.com/5511987654321")).toBeNull();
    expect(mocks.tickets).not.toHaveBeenCalled();
  });
  it("opens an existing pending conversation without assigning it again", async () => {
    mocks.tickets.mockImplementation(({ status }) => Promise.resolve(status === "pending" ? [existing] : []));
    expect(await startSharedContactConversation(card, 2, 7)).toEqual(existing);
    expect(mocks.createTicket).not.toHaveBeenCalled();
    expect(mocks.createContact).not.toHaveBeenCalled();
  });
  it("uses the exact contact match and selected connection", async () => {
    mocks.contacts.mockResolvedValue({ data: [{ ...existing.contact, id: 99, number: "5511987654322" }, existing.contact], total: 2, pageSize: 20 });
    await startSharedContactConversation(card, 2, 7);
    expect(mocks.createTicket).toHaveBeenCalledWith({ contactId: 8, whatsappId: 2, userId: 7 }, existing.contact);
    expect(mocks.createContact).not.toHaveBeenCalled();
  });
  it("creates a missing shared contact before starting the conversation", async () => {
    await startSharedContactConversation(card, 2, 7);
    expect(mocks.createContact).toHaveBeenCalledWith({ name: "Maria", number: "5511987654321", email: "", tags: [] });
    expect(mocks.createTicket).toHaveBeenCalledWith({ contactId: 8, whatsappId: 2, userId: 7 }, existing.contact);
  });
  it("does not reuse another connection's conversation", async () => {
    mocks.tickets.mockResolvedValue([{ ...existing, whatsapp: { id: 3 } }]);
    await startSharedContactConversation(card, 2, 7);
    expect(mocks.createTicket).toHaveBeenCalledWith({ contactId: 8, whatsappId: 2, userId: 7 }, existing.contact);
  });
});