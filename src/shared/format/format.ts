/**
 * Formatação apenas para exibição. Valores monetários chegam em CENTAVOS inteiros
 * do backend, que é a autoridade financeira.
 */
export function formatCents(cents: number, currency = "BRL", locale = "pt-BR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

/**
 * Converte texto digitado ("1.234,56") em centavos sem usar ponto flutuante.
 * Retorna null se inválido.
 */
export function parseMoneyToCents(input: string): number | null {
  const clean = input.replace(/\s|R\$/g, "").replace(/\./g, "");
  const m = /^(\d+)(?:,(\d{1,2}))?$/.exec(clean);
  if (!m) return null;
  const reais = m[1] ?? "0";
  const centavos = (m[2] ?? "").padEnd(2, "0");
  return parseInt(reais, 10) * 100 + parseInt(centavos, 10);
}

export function centsToInput(cents: number): string {
  const reais = Math.trunc(cents / 100);
  const c = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${reais},${c}`;
}

export function formatDate(iso: string | null | undefined, withTime = false, locale = "pt-BR") {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(d);
}

export function formatNumber(n: number, locale = "pt-BR") {
  return new Intl.NumberFormat(locale).format(n);
}
