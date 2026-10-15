import type { ContactInput } from "./types";

/** Normaliza o número para o formato do WhatsApp: só dígitos, com DDI 55. */
export function normalizeNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Número brasileiro sem DDI (10-11 dígitos): assume 55.
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

export function isValidNumber(raw: string): boolean {
  const n = normalizeNumber(raw);
  return n.length >= 12 && n.length <= 15;
}

export interface ImportRow {
  input: ContactInput;
  /** Motivo pelo qual a linha será ignorada, se houver. */
  skip?: string;
}

/**
 * Lê um CSV/texto com colunas nome;numero;email;etiquetas.
 * Aceita separador `;` ou `,` e linha de cabeçalho opcional.
 */
export function parseContactsCsv(text: string, skipReasons: { invalidNumber: string; noName: string }): ImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("nome") || first.includes("name") || first.includes("numero") || first.includes("número");
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name = "", number = "", email = "", tagsText = ""] = cols;
    const normalized = normalizeNumber(number);
    const input: ContactInput = {
      name,
      number: normalized || number,
      email,
      tags: tagsText.split("|").map((s) => s.trim()).filter(Boolean),
    };
    let skip: string | undefined;
    if (!name) skip = skipReasons.noName;
    else if (!isValidNumber(number)) skip = skipReasons.invalidNumber;
    return { input, ...(skip ? { skip } : {}) };
  });
}
