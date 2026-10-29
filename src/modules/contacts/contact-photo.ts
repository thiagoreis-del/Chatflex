import { env } from "@/shared/config/env";

/** Only use the photo URL returned with the authenticated contact. */
export function contactPhotoUrl(value?: string | null): string | undefined {
  const photo = value?.trim();
  if (!photo) return undefined;
  try {
    const url = new URL(photo, `${env.apiUrl}/`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function contactInitials(name: string): string {
  const words = name.trim().replace(/^\+/, "").split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "#";
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return `${Array.from(first)[0] ?? ""}${last ? Array.from(last)[0] ?? "" : ""}`.toLocaleUpperCase("pt-BR");
}