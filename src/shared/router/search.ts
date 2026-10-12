/** Lê filtros de lista da URL: page/pageSize numéricos e demais chaves como texto. */
export function parseListSearch<T extends { page: number; pageSize: number }>(
  raw: Record<string, unknown>,
  keys: readonly string[],
): T {
  const out: Record<string, unknown> = {
    page: Math.max(1, Number(raw["page"]) || 1),
    pageSize: Math.min(100, Math.max(1, Number(raw["pageSize"]) || 20)),
  };
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out as T;
}
