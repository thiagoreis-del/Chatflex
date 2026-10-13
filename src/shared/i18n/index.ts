import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { env } from "@/shared/config/env";
import common from "./locales/pt-BR/common.json";
import auth from "./locales/pt-BR/auth.json";
import dashboard from "./locales/pt-BR/dashboard.json";
import errors from "./locales/pt-BR/errors.json";
import landing from "./locales/pt-BR/landing.json";
import platform from "./locales/pt-BR/platform.json";
import whatsapp from "./locales/pt-BR/whatsapp.json";
import contacts from "./locales/pt-BR/contacts.json";
import team from "./locales/pt-BR/team.json";
import tickets from "./locales/pt-BR/tickets.json";

export const supportedLanguages = ["pt-BR"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    defaultNS: "common",
    ns: ["common", "auth", "dashboard", "errors", "landing", "platform", "whatsapp", "contacts", "team", "tickets"],
    resources: { "pt-BR": { common, auth, dashboard, errors, landing, platform, whatsapp, contacts, team, tickets } },
    interpolation: { escapeValue: false, defaultVariables: { appName: env.appName } },
  });
}

export { i18n };
