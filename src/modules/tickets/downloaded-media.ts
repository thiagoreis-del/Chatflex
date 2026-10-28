/**
 * Registra os arquivos de mídia que o atendente salvou no dispositivo,
 * para exibir o selo verde "baixado para ouvir offline".
 *
 * A lista fica no localStorage do navegador: é por dispositivo,
 * sem envio ao servidor. Falhas de leitura/escrita (navegadores que
 * bloqueiam storage, modo privado) apenas ignoram o selo.
 */

const STORAGE_KEY = "chatflex.downloaded-media";

function readUrls(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeUrls(urls: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  } catch {
    // Sem storage disponível: o selo não persiste, mas nada quebra.
  }
}

export function isDownloaded(url: string): boolean {
  if (!url) return false;
  return readUrls().includes(url);
}

export function markDownloaded(url: string) {
  if (!url) return;
  const urls = readUrls();
  if (urls.includes(url)) return;
  writeUrls([...urls, url]);
}
