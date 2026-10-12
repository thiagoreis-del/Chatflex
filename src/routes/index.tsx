import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/landing/LandingPage";
import { i18n } from "@/shared/i18n";

export const Route = createFileRoute("/")({
  head: () => {
    const title = i18n.t("landing:metaTitle");
    const description = i18n.t("landing:metaDescription");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: LandingPage,
});
