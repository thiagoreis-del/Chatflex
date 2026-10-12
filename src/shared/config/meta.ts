import { i18n } from "@/shared/i18n";
import { env } from "./env";

/** Metadados de página a partir das traduções. */
export function pageMeta(
  titleKey: string,
  descriptionKey?: string,
  extra: { noindex?: boolean } = {},
) {
  const title = `${i18n.t(titleKey)} · ${env.appName}`;
  const description = i18n.t(descriptionKey ?? "landing:metaDescription");
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      ...(extra.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
  };
}
