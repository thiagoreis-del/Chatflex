import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MarketplacePage } from "@/modules/marketplace/pages/MarketplacePage";
import { apiRequest } from "@/shared/api/client";
import { clearSession, setSessionUser } from "@/shared/auth/session-store";
import type { AuthenticatedUser } from "@/shared/auth/types";
import "@/shared/i18n";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn() }));

const request = vi.mocked(apiRequest);
const user: AuthenticatedUser = {
  id: "1",
  companyId: "42",
  name: "Atendente",
  email: "atendente@example.test",
  role: "agent",
  permissions: [],
};
const template = {
  id: 1,
  shortcode: "entrega",
  message: "Podemos combinar a entrega.",
  geral: false,
  companyId: 42,
};

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({ records: [template], hasMore: false });
  setSessionUser(user);
});

afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});

function openWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MarketplacePage />
    </QueryClientProvider>,
  );
}

it("keeps the draft when adding a saved reply and copies its edited content", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal(
    "navigator",
    Object.create(window.navigator, { clipboard: { value: { writeText } } }),
  );
  openWorkspace();
  const reply = screen.getByRole("textbox", { name: "Sua resposta" });
  const copy = screen.getByRole("button", { name: "Copiar resposta" });
  expect(copy).toBeDisabled();
  fireEvent.change(reply, { target: { value: "Olá!" } });
  const saved = await screen.findByRole("button", { name: /entrega/ });
  fireEvent.click(saved);
  expect(reply).toHaveValue("Olá!\n\nPodemos combinar a entrega.");
  fireEvent.click(copy);
  expect(await screen.findByText("Resposta copiada.")).toBeVisible();
  expect(writeText).toHaveBeenCalledWith("Olá!\n\nPodemos combinar a entrega.");
  const messenger = screen.getByRole("link", { name: "Abrir Messenger" });
  expect(messenger).toHaveAttribute("href", "https://www.facebook.com/messages/t/");
  expect(messenger).toHaveAttribute("target", "_blank");
});

it("discards a draft and reloads private quick replies when the user changes", async () => {
  openWorkspace();
  await screen.findByRole("button", { name: /entrega/ });
  fireEvent.change(screen.getByRole("textbox", { name: "Sua resposta" }), {
    target: { value: "rascunho anterior" },
  });
  request.mockResolvedValue({ records: [{ ...template, id: 2, shortcode: "horario" }] });

  act(() => setSessionUser({ ...user, id: "2" }));
  expect(screen.getByRole("textbox", { name: "Sua resposta" })).toHaveValue("");
  expect(screen.queryByRole("button", { name: /^\/entrega/ })).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /^\/horario/ })).toBeVisible();
});
