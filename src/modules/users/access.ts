import { env } from "@/shared/config/env";

export { generatePassword } from "@/shared/auth/generate-password";

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
