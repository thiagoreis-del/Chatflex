import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AppLogo, AppName, DemoBanner, ThemeToggle } from "@/shared/components";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-hero">
      <DemoBanner />
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <AppLogo />
          <AppName className="text-lg" />
        </Link>
        <ThemeToggle />
      </header>
      <main id="conteudo" className="flex flex-1 items-start justify-center px-4 pb-12 pt-6 sm:items-center">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
