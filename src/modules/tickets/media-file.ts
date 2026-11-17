/**
 * Baixa o arquivo como Blob e salva com o nome real.
 * O atributo `download` é ignorado em URLs de outra origem (API),
 * então o clique abriria o PDF numa aba em vez de baixar.
 */
export async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  } catch {
    // Sem acesso ao conteúdo (ex.: CORS): abre em nova aba como antes.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Extensões derivadas do MIME pelo backend (ex.: `.x-pkcs12`) → extensão real. */
const MIME_EXTENSIONS: Record<string, string> = {
  "x-pkcs12": "pfx",
  pkcs12: "pfx",
  "x-pkcs7-certificates": "p7b",
  "x-x509-ca-cert": "cer",
  "pkix-cert": "cer",
  "x-zip-compressed": "zip",
  "x-rar-compressed": "rar",
  "vnd.rar": "rar",
  "x-7z-compressed": "7z",
  plain: "txt",
  msword: "doc",
  "vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "vnd.ms-excel": "xls",
  "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "vnd.ms-powerpoint": "ppt",
  "vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "octet-stream": "bin",
};

export function normalizeFileExtension(filename: string) {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return filename;
  const ext = filename.slice(dot + 1).toLowerCase();
  const mapped = MIME_EXTENSIONS[ext];
  return mapped ? `${filename.slice(0, dot)}.${mapped}` : filename;
}

export function fileNameFromUrl(url: string) {
  let name: string;
  try {
    name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "") || url;
  } catch {
    name = url;
  }
  return normalizeFileExtension(name);
}

/** Legenda gerada automaticamente com o nome interno do arquivo (ex.: 179..._179....x-pkcs12). */
export function isAutoFileCaption(body: string | null | undefined, mediaUrl?: string | null) {
  const text = body?.trim();
  if (!text || !mediaUrl) return false;
  const urlName = (() => {
    try {
      return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop() ?? "");
    } catch {
      return "";
    }
  })();
  if (text === urlName || normalizeFileExtension(text) === fileNameFromUrl(mediaUrl)) return true;
  return /^\d{10,}([_-]\d{10,})?\.[\w.-]+$/.test(text);
}

/**
 * Converte o nome interno criado pelo upload em um nome amigável.
 * Ex.: 1793295959621_Joao_Matheus_Bonato_1793295959621.pdf
 * vira Joao Matheus Bonato.pdf.
 */
export function displayFileName(filename: string) {
  const dot = filename.lastIndexOf(".");
  const extension = dot > 0 ? filename.slice(dot) : "";
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  if (/^\d{10,}$/.test(stem)) return `${stem}${extension}`;
  const cleaned = stem
    .replace(/^\d{10,}[_-]+/, "")
    .replace(/[_-]+\d{10,}$/, "")
    .replace(/_+/g, " ")
    .trim();

  return `${cleaned || stem}${extension}`;
}
