import type { Ticket } from "./types";

/**
 * Decide se o envio de uma mensagem deve assumir o ticket antes de responder.
 * - Ticket aguardando/grupo: quem envia aceita o atendimento automaticamente.
 * - Ticket aberto sem responsável: quem envia assume.
 * - Admin respondendo como outro usuário: o ticket passa para esse usuário.
 */
export const shouldAutoAssignOnSend = (
  ticket: Pick<Ticket, "status" | "user">,
  senderId: number | null | undefined,
  replyAs?: { id: number },
): senderId is number => {
  if (!senderId) return false;
  const needsAccept = ticket.status !== "open" && ticket.status !== "closed";
  if (needsAccept || !ticket.user) return true;
  return replyAs !== undefined && ticket.user.id !== senderId;
};
