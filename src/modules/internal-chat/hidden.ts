/**
 * "Excluir para mim" no chat interno.
 *
 * O contrato verificado de /chats não expõe exclusão de mensagem individual,
 * então a remoção é local ao dispositivo/navegador, isolada por empresa e
 * usuário — nunca esconde a mensagem dos outros participantes.
 */
const PREFIX = "chatflex.internal-hidden";
const LIMIT = 2000;

const storageKey = (companyId: string | number, userId: string | number) =>
  `${PREFIX}.${companyId}.${userId}`;

export function listHiddenMessages(
  companyId: string | number,
  userId: string | number,
): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId, userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function hideMessageForMe(
  companyId: string | number,
  userId: string | number,
  messageId: string,
): string[] {
  const current = listHiddenMessages(companyId, userId);
  if (current.includes(messageId)) return current;
  const next = [...current, messageId].slice(-LIMIT);
  try {
    window.localStorage.setItem(storageKey(companyId, userId), JSON.stringify(next));
  } catch {
    // Armazenamento cheio/indisponível: a mensagem apenas não fica oculta.
  }
  return next;
}
