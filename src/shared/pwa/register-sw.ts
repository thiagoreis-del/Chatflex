/**
 * Único ponto de registro do service worker do app (/sw.js).
 * Nunca registra em dev nem nos previews da Lovable; nesses contextos,
 * remove registros antigos do app para evitar cache velho.
 * Suporte a ?sw=off como botão de emergência.
 */

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.self !== window.top) return true; // dentro de iframe (preview)
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((r) => r.active?.scriptURL.endsWith(SW_URL) || r.scope === `${location.origin}/`)
        .map((r) => r.unregister()),
    );
  } catch {
    // silencioso: limpeza é best-effort
  }
}

export async function registerAppServiceWorker(): Promise<void> {
  if (isRefusedContext()) {
    await unregisterAppServiceWorkers();
    return;
  }
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    // Falha de registro não pode quebrar o app.
  }
}
