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

export function fileNameFromUrl(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "") || url;
  } catch {
    return url;
  }
}
