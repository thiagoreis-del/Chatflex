import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Users,
  UserCog,
  ListOrdered,
  Smartphone,
  BarChart3,
  Settings,
  Building2,
  Layers,
  Repeat,
  Receipt,
  ScrollText,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AppLogo,
  AppName,
  ConfirmDialog,
  DemoBanner,
  LanguageSelector,
  ThemeToggle,
} from "@/shared/components";
import { useSession } from "@/shared/auth/session-store";
import { logout } from "@/shared/auth/auth-service";
import { usePermissions } from "@/shared/permissions/permissions";

const soonModules = [
  { key: "reports", icon: BarChart3 },
  { key: "settings", icon: Settings },
] as const;

const platformLinks = [
  { to: "/app/plataforma", key: "overview", icon: Gauge, exact: true },
  { to: "/app/plataforma/empresas", key: "companies", icon: Building2, exact: false },
  { to: "/app/plataforma/planos", key: "plans", icon: Layers, exact: false },
  { to: "/app/plataforma/assinaturas", key: "subscriptions", icon: Repeat, exact: false },
  { to: "/app/plataforma/faturas", key: "invoices", icon: Receipt, exact: false },
  { to: "/app/plataforma/auditoria", key: "audit", icon: ScrollText, exact: false },
] as const;

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const activeLink = {
  className: "bg-sidebar-accent text-sidebar-accent-foreground",
  "aria-current": "page" as const,
};

function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { t } = useTranslation();
  const { hasRole } = usePermissions();
  const isSuperadmin = hasRole("superadmin");
  return (
    <nav aria-label={t("nav.main")} className="flex flex-1 flex-col gap-6 px-3">
      <ul className="space-y-1">
        <li>
          <Link
            to="/app/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
              "aria-current": "page",
            }}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            {t("nav.dashboard")}
          </Link>
        </li>
      </ul>
      {isSuperadmin && (
        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.platform.section")}
          </p>
          <ul className="space-y-1">
            {platformLinks.map(({ to, key, icon: Icon, exact }) => (
              <li key={key}>
                <Link
                  to={to}
                  onClick={onNavigate}
                  className={linkClass}
                  activeOptions={{ exact }}
                  activeProps={activeLink}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(`nav.platform.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isSuperadmin && (
        <ul className="space-y-1">
          <li>
            <Link
              to="/app/atendimento"
              onClick={onNavigate}
              className={linkClass}
              activeProps={activeLink}
            >
              <MessagesSquare className="size-4" aria-hidden />
              {t("nav.modules.tickets")}
            </Link>
          </li>
          <li>
            <Link
              to="/app/conexoes"
              onClick={onNavigate}
              className={linkClass}
              activeProps={activeLink}
            >
              <Smartphone className="size-4" aria-hidden />
              {t("nav.modules.whatsapp")}
            </Link>
          </li>
          <li>
            <Link
              to="/app/contatos"
              onClick={onNavigate}
              className={linkClass}
              activeProps={activeLink}
            >
              <Users className="size-4" aria-hidden />
              {t("nav.modules.contacts")}
            </Link>
          </li>
          {hasRole("company_admin") && (
            <>
              <li>
                <Link
                  to="/app/usuarios"
                  onClick={onNavigate}
                  className={linkClass}
                  activeProps={activeLink}
                >
                  <UserCog className="size-4" aria-hidden />
                  {t("nav.modules.users")}
                </Link>
              </li>
              <li>
                <Link
                  to="/app/filas"
                  onClick={onNavigate}
                  className={linkClass}
                  activeProps={activeLink}
                >
                  <ListOrdered className="size-4" aria-hidden />
                  {t("nav.modules.queues")}
                </Link>
              </li>
            </>
          )}
        </ul>
      )}
      {!isSuperadmin && (
        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.soon")}
          </p>
          <ul className="space-y-1">
            {soonModules.map(({ key, icon: Icon }) => (
              <li
                key={key}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/45"
              >
                <Icon className="size-4" aria-hidden />
                {t(`nav.modules.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar py-5 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6">
        <AppLogo />
        <AppName className="text-lg" />
      </div>
      <SidebarNav onNavigate={onNavigate} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const router = useRouter();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    await logout(router.options.context.queryClient);
    await navigate({ to: "/login", replace: true });
  };

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      <DemoBanner />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 h-screen">
            <SidebarBody />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t("actions.openMenu")}
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 p-0">
                <SheetTitle className="sr-only">{t("nav.main")}</SheetTitle>
                <SidebarBody onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 lg:hidden">
              <AppLogo className="size-7" />
              <AppName />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <LanguageSelector />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 gap-2 px-2"
                    aria-label={t("profile.menu")}
                  >
                    <span
                      className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                      aria-hidden
                    >
                      {initials}
                    </span>
                    <span className="hidden text-left text-sm leading-tight sm:block">
                      <span className="block font-medium">{user?.name}</span>
                      <span className="block text-xs text-muted-foreground">{user?.companyId}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block font-medium">{user?.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {t("profile.company")}: {user?.companyId}
                    <br />
                    {t("profile.role")}: {user ? t(`roles.${user.role}`) : ""}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>
                    <LogOut className="size-4" aria-hidden />
                    {t("actions.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("logoutConfirm.title")}
        description={t("logoutConfirm.description")}
        confirmLabel={t("actions.logout")}
        onConfirm={() => void handleLogout()}
      />
    </div>
  );
}
