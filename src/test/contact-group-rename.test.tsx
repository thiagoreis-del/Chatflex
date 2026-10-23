import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const { updateContact, createContact } = vi.hoisted(() => ({
  updateContact: vi.fn().mockResolvedValue({}),
  createContact: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/modules/contacts/api", () => ({ updateContact, createContact }));

import { ContactFormDialog } from "@/modules/contacts/components/ContactFormDialog";
import type { Contact } from "@/modules/contacts/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderDialog = (value: Contact | "new", existing: Contact[] = []) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ContactFormDialog value={value} existing={existing} onClose={() => {}} onSaved={() => {}} />
    </QueryClientProvider>,
  );
};

const submit = () => {
  fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
};

describe("Group contact rename does not require a number", () => {
  it("saves a group with no number at all", async () => {
    const group: Contact = { id: 7, name: "Equipe Vendas", number: "", isGroup: true };
    renderDialog(group);
    fireEvent.change(screen.getByLabelText("form.name"), { target: { value: "Equipe Comercial" } });
    submit();
    await vi.waitFor(() => expect(updateContact).toHaveBeenCalled());
    expect(updateContact).toHaveBeenCalledWith(7, {
      name: "Equipe Comercial",
      email: "",
      tags: [],
    });
  });

  it("keeps the number required for a regular contact", async () => {
    renderDialog({ id: 3, name: "Ana", number: "" });
    submit();
    await new Promise((r) => setTimeout(r, 0));
    expect(updateContact).not.toHaveBeenCalled();
  });

  it("still requires a name for a group", async () => {
    renderDialog({ id: 7, name: "", number: "", isGroup: true });
    submit();
    await new Promise((r) => setTimeout(r, 0));
    expect(updateContact).not.toHaveBeenCalled();
  });
});
