/** Ordem de preferência: OGG/Opus é o formato nativo de voz do WhatsApp. */
export const AUDIO_MIME_PREFERENCE = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
] as const;

export function pickAudioMime(isSupported: (mime: string) => boolean): string | null {
  return AUDIO_MIME_PREFERENCE.find((mime) => isSupported(mime)) ?? null;
}

export function audioExtension(mime: string): "ogg" | "m4a" | "webm" {
  const base = mime.split(";")[0]!.trim().toLowerCase();
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/mp4") return "m4a";
  return "webm";
}

const AUDIO_EXT = /\.(ogg|oga|opus|webm|m4a|mp4a|mp3|mpeg|wav|aac)(\?|$)/i;

/** Reconhece áudio por mediaType ("audio" ou "audio/ogg" etc.) ou pela extensão da URL. */
export function isAudioMedia(mediaType?: string | null, url?: string | null) {
  if (mediaType && /^audio(\/|$)/i.test(mediaType)) return true;
  if (mediaType === "ptt" || mediaType === "voice") return true;
  return !mediaType && AUDIO_EXT.test(url ?? "");
}

/** Extensões executáveis/scripts que nunca devem ser anexadas. */
const DANGEROUS = /\.(exe|bat|cmd|com|msi|scr|ps1|vbs|js|jar|sh|apk|dll|hta|lnk)$/i;
export const isDangerousFile = (name: string) => DANGEROUS.test(name.trim());
