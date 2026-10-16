/**
 * Rascunhos e fila de mensagens pendentes (modo offline).
 * Apenas texto entra na fila — anexos não são persistidos no navegador.
 * Chaves incluem empresa e ticket para nunca misturar dados entre empresas.
 */

const DRAFT_PREFIX = "cf-draft";
const OUTBOX_PREFIX = "cf-outbox";

export interface PendingMessage {
  id: string;
  ticketId: number;
  body: string;
  isPrivate: boolean;
  createdAt: string;
}

const draftKey = (companyId: string, ticketId: number) => `${DRAFT_PREFIX}:${companyId}:${ticketId}`;
const outboxKey = (companyId: string) => `${OUTBOX_PREFIX}:${companyId}`;

export function loadDraft(companyId: string, ticketId: number): string {
  try {
    return localStorage.getItem(draftKey(companyId, ticketId)) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(companyId: string, ticketId: number, text: string): void {
  try {
    const key = draftKey(companyId, ticketId);
    if (text.trim()) localStorage.setItem(key, text);
    else localStorage.removeItem(key);
  } catch {
    // armazenamento indisponível: ignora
  }
}

export function clearDraft(companyId: string, ticketId: number): void {
  try {
    localStorage.removeItem(draftKey(companyId, ticketId));
  } catch {
    // ignora
  }
}

export function listOutbox(companyId: string): PendingMessage[] {
  try {
    const raw = localStorage.getItem(outboxKey(companyId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingMessage[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(companyId: string, items: PendingMessage[]): void {
  try {
    if (items.length) localStorage.setItem(outboxKey(companyId), JSON.stringify(items));
    else localStorage.removeItem(outboxKey(companyId));
  } catch {
    // ignora
  }
}

export function enqueueOutbox(
  companyId: string,
  item: Omit<PendingMessage, "id" | "createdAt">,
): void {
  const items = listOutbox(companyId);
  items.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  writeOutbox(companyId, items);
}

export function removeFromOutbox(companyId: string, id: string): void {
  writeOutbox(
    companyId,
    listOutbox(companyId).filter((m) => m.id !== id),
  );
}
