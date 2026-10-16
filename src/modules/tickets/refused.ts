// Atendimentos recusados ficam ocultos para o atendente que recusou.
// Os IDs são guardados por usuário no navegador e expiram após 7 dias.
// O backend continua recebendo a atualização padrão do ticket.

import { useSyncExternalStore } from "react";

const KEY_PREFIX = "chatflex:refused:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface RefusedEntry {
  id: number;
  at: number;
}

const EMPTY: ReadonlySet<number> = new Set();
const listeners = new Set<() => void>();
let version = 0;
let cache: { key: string; version: number; ids: ReadonlySet<number> } | null = null;

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId || "anon"}`;
}

function parseEntries(raw: string | null): RefusedEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (e): e is RefusedEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as RefusedEntry).id === "number" &&
        typeof (e as RefusedEntry).at === "number" &&
        now - (e as RefusedEntry).at < MAX_AGE_MS,
    );
  } catch {
    return [];
  }
}

/** IDs de atendimentos recusados e ocultos para o usuário. */
export function getRefusedHiddenIds(userId: string): Set<number> {
  return new Set(
    parseEntries(window.localStorage.getItem(storageKey(userId))).map((e) => e.id),
  );
}

function writeEntries(userId: string, entries: RefusedEntry[]) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(entries));
  } catch {
    // Sem espaço no navegador: a lista só não persiste entre recarregamentos.
  }
}

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

/** Oculta o atendimento recusado para o atendente que recusou. */
export function hideRefusedTicket(userId: string, ticketId: number) {
  const entries = parseEntries(window.localStorage.getItem(storageKey(userId))).filter(
    (e) => e.id !== ticketId,
  );
  entries.push({ id: ticketId, at: Date.now() });
  writeEntries(userId, entries);
  notify();
}

/** Reexibe o atendimento (usado quando a recusa falha no servidor). */
export function restoreRefusedTicket(userId: string, ticketId: number) {
  const entries = parseEntries(window.localStorage.getItem(storageKey(userId))).filter(
    (e) => e.id !== ticketId,
  );
  writeEntries(userId, entries);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Lista de IDs ocultos, reativa a novas recusas. */
export function useRefusedHiddenIds(userId: string | undefined): ReadonlySet<number> {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!userId) return EMPTY;
      const key = storageKey(userId);
      if (!cache || cache.key !== key || cache.version !== version) {
        cache = { key, version, ids: getRefusedHiddenIds(userId) };
      }
      return cache.ids;
    },
    () => EMPTY,
  );
}
