import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AppLogo, AppName, ThemeToggle } from "@/shared/components";

export function StatusPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-hero">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <AppLogo />
          <AppName className="text-lg" />
        </Link>
        <ThemeToggle />
      </header>
      <main id="conteudo" className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg rounded-2xl border bg-card shadow-soft">{children}</div>
      </main>
    </div>
  );
}
