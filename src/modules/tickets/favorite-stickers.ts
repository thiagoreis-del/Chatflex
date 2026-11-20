import { useSyncExternalStore } from "react";

/**
 * Figurinhas favoritas: URLs de mídia salvas no navegador, isoladas por
 * empresa e usuário (não há contrato de favoritos confirmado no backend).
 */
const PREFIX = "chatflex.favorite-stickers";
const LIMIT = 100;
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, string[]>();

export const favoriteStickersKey = (companyId: string | number, userId: string | number) =>
  `${PREFIX}.${companyId}.${userId}`;

function read(key: string): string[] {
  const hit = cache.get(key);
  if (hit) return hit;
  let list: string[] = [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (Array.isArray(parsed)) list = parsed.filter((u): u is string => typeof u === "string");
  } catch {
    list = [];
  }
  cache.set(key, list);
  return list;
}

function write(key: string, list: string[]) {
  cache.set(key, list);
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((l) => l());
}

export function toggleFavoriteSticker(key: string, url: string) {
  const list = read(key);
  write(key, list.includes(url) ? list.filter((u) => u !== url) : [url, ...list].slice(0, LIMIT));
}

export function useFavoriteStickers(key: string | null): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (key ? read(key) : EMPTY),
    () => EMPTY,
  );
}
