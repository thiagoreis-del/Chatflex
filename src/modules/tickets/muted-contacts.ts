import { useSyncExternalStore } from "react";

/**
 * Contatos/grupos silenciados "para sempre" (até reativar), por empresa e atendente.
 * Guarda apenas IDs de contato no navegador — nenhum dado sensível.
 */
const PREFIX = "chatflex:muted:";
const listeners = new Set<() => void>();
const cache = new Map<string, number[]>();

export function mutedKey(companyId: string | number, userId: string | number) {
  return `${PREFIX}${companyId}:${userId}`;
}

function read(key: string): number[] {
  const hit = cache.get(key);
  if (hit) return hit;
  let ids: number[] = [];
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((x): x is number => Number.isInteger(x));
  } catch {
    ids = [];
  }
  cache.set(key, ids);
  return ids;
}

export function isMuted(key: string, contactId: number | undefined | null) {
  return contactId != null && read(key).includes(contactId);
}

export function setMuted(key: string, contactId: number, muted: boolean) {
  const current = read(key).filter((id) => id !== contactId);
  const next = muted ? [...current, contactId] : current;
  cache.set(key, next);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* Storage indisponível: vale só nesta sessão. */
  }
  listeners.forEach((l) => l());
}

const EMPTY: number[] = [];
export function useMutedContacts(key: string | null): number[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (key ? read(key) : EMPTY),
    () => EMPTY,
  );
}
