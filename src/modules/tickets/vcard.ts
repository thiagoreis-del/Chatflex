export interface ParsedVCard {
  name: string;
  phone: string | null;
}

const unfold = (text: string) =>
  text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");

const unescape = (value: string) =>
  value
    .replace(/\\n/gi, "\n")
    .replace(/\\([,;\\])/g, "$1")
    .trim();

const field = (lines: string[], key: string) => {
  const line = lines.find((l) => l.toUpperCase().startsWith(`${key}:`) || l.toUpperCase().startsWith(`${key};`));
  if (!line) return null;
  return unescape(line.slice(line.indexOf(":") + 1));
};

/** Detecta se o corpo da mensagem é um contato compartilhado (vCard). */
export const isVCard = (body: string | null | undefined) =>
  !!body && /^\s*BEGIN:VCARD/i.test(body);

/** Extrai nome e telefone de um vCard; retorna null se não houver nada útil. */
export const parseVCard = (body: string): ParsedVCard | null => {
  if (!isVCard(body)) return null;
  const lines = unfold(body).split("\n");
  const fn = field(lines, "FN");
  const n = field(lines, "N");
  const name =
    fn ||
    (n ? n.split(";").filter(Boolean).reverse().join(" ") : null) ||
    field(lines, "X-WA-BIZ-NAME");
  const telLine = lines.find((l) => /^TEL/i.test(l));
  let phone: string | null = null;
  if (telLine) {
    const waid = /waid=(\d+)/i.exec(telLine)?.[1];
    const value = telLine.slice(telLine.indexOf(":") + 1).trim();
    phone = waid ? `+${waid}` : value || null;
  }
  if (!name && !phone) return null;
  return { name: name || phone || "", phone };
};
