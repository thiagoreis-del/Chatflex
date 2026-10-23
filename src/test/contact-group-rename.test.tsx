import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const updateContact = vi.fn().mockResolvedValue({});
const createContact = vi.fn().mockResolvedValue({});
vi.mock("@/modules/contacts/api", () => ({ updateContact, createContact }));

import { ContactFormDialog } from "@/modules/contacts/components/ContactFormDialog";
import type { Contact } from "@/modules/contacts/types";

afterEach(cleanup);

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
  it("saves a group with no number at all", () => {
    const group: Contact = { id: 7, name: "Equipe Vendas", number: "", isGroup: true };
    renderDialog(group);
    fireEvent.change(screen.getByLabelText("form.name"), { target: { value: "Equipe Comercial" } });
    submit();
    expect(updateContact).toHaveBeenCalledWith(7, {
      name: "Equipe Comercial",
      number: "",
      email: "",
      tags: [],
    });
  });

  it("keeps the number required for a regular contact", () => {
    renderDialog({ id: 3, name: "Ana", number: "" });
    submit();
    expect(updateContact).not.toHaveBeenCalled();
  });

  it("still requires a name for a group", () => {
    renderDialog({ id: 7, name: "", number: "", isGroup: true });
    submit();
    expect(updateContact).not.toHaveBeenCalled();
  });
});
