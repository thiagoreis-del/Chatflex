/**
 * Respostas com citação no chat interno.
 *
 * O contrato verificado de /chats não possui campo de mensagem citada, então a
 * citação viaja codificada na primeira linha do corpo: `⟦reply:BASE64⟧\n` +
 * texto. Todos os clientes do chat interno são este app, que renderiza a
 * citação como bloco e remove o marcador das prévias.
 */
export interface ReplyQuote {
  id: string;
  sender: string;
  snippet: string;
}

const REPLY_RE = /^⟦reply:([A-Za-z0-9+/=]+)⟧\r?\n?/;

export function encodeReplyBody(quote: ReplyQuote, body: string): string {
  const json = JSON.stringify({
    id: quote.id,
    sender: quote.sender.slice(0, 80),
    snippet: quote.snippet.slice(0, 140),
  });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `⟦reply:${btoa(binary)}⟧\n${body}`;
}

export function parseReplyBody(raw: string): { quote: ReplyQuote | null; body: string } {
  const match = REPLY_RE.exec(raw);
  if (!match) return { quote: null, body: raw };
  try {
    const binary = atob(match[1]!);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Partial<ReplyQuote>;
    if (typeof data.sender !== "string" || typeof data.snippet !== "string") {
      return { quote: null, body: raw };
    }
    return {
      quote: { id: String(data.id ?? ""), sender: data.sender, snippet: data.snippet },
      body: raw.slice(match[0].length),
    };
  } catch {
    return { quote: null, body: raw };
  }
}

/** Remove o marcador de citação — usado em prévias, cópias e encaminhamento. */
export const stripQuote = (raw: string): string => parseReplyBody(raw).body;

/** Trecho de uma linha para a citação, sem quebras. */
export function quoteSnippet(body: string, max = 140): string {
  const single = stripQuote(body).replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}
