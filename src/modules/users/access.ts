import { env } from "@/shared/config/env";

/** Senha temporária forte gerada no navegador (crypto). Nunca é armazenada. */
export function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

export interface AccessData {
  company: string;
  email: string;
  password: string;
}

export const accessMessage = (a: AccessData) =>
  [
    "🔐 SEU ACESSO AO SISTEMA",
    "",
    `🏢 Empresa: ${a.company}`,
    "",
    `🌐 Link: ${env.appUrl}/login`,
    "",
    `👤 Login: ${a.email}`,
    "",
    `🔑 Senha temporária: ${a.password}`,
    "",
    "Bem-vindo! Utilize os dados acima para acessar o sistema.",
  ].join("\n");

export const whatsappLink = (text: string, phone?: string) =>
  `https://wa.me/${(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
