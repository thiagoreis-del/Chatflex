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
  Zap,
  DatabaseBackup,
  UsersRound,
  ImagePlus,
  PanelLeftClose,
  PanelLeftOpen,
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
  GroupFooter,
  LanguageSelector,
  ThemeToggle,
} from "@/shared/components";
import { useSession } from "@/shared/auth/session-store";
import { exitCompany, logout } from "@/shared/auth/auth-service";
import { toast } from "sonner";
import { usePermissions } from "@/shared/permissions/permissions";
import { can } from "@/shared/permissions/catalog";
import { IncomingNotifications } from "@/modules/tickets/components/IncomingNotifications";
import { AdminAlerts } from "@/modules/tickets/components/AdminAlerts";
import { SlaWatcher } from "@/modules/sla/components/SlaWatcher";

const soonModules = [{ key: "reports", icon: BarChart3 }] as const;

const platformLinks = [
  { to: "/app/plataforma", key: "overview", icon: Gauge, exact: true },
  { to: "/app/plataforma/empresas", key: "companies", icon: Building2, exact: false },
  { to: "/app/plataforma/planos", key: "plans", icon: Layers, exact: false },
  { to: "/app/plataforma/assinaturas", key: "subscriptions", icon: Repeat, exact: false },
  { to: "/app/plataforma/faturas", key: "invoices", icon: Receipt, exact: false },
  { to: "/app/plataforma/auditoria", key: "audit", icon: ScrollText, exact: false },
  { to: "/app/plataforma/backups", key: "backups", icon: DatabaseBackup, exact: false },
] as const;

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const activeLink = {
  className: "bg-sidebar-accent text-sidebar-accent-foreground",
  "aria-current": "page" as const,
};

const DESKTOP_MENU_STORAGE_KEY = "chatflex.desktop-menu-open";

/** Cabeçalho de seção do menu: marcador de cor, rótulo e filete decorativo. */
function SectionTitle({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-3">
      <span className="size-1.5 shrink-0 rounded-full bg-sidebar-primary" aria-hidden />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/60">
        {label}
      </span>
      <span
        className="h-px flex-1 bg-gradient-to-r from-sidebar-border to-transparent"
        aria-hidden
      />
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { t } = useTranslation();
  const { hasRole } = usePermissions();
  const { user } = useSession();
  const isSuperadmin = user?.role === "superadmin" && !user?.impersonated;
  void hasRole;
  return (
    <nav aria-label={t("nav.main")} className="flex flex-1 flex-col gap-6 px-3">
      {!isSuperadmin && (
        <ul className="space-y-1">
          <li>
            <Link
              to="/app/dashboard"
              onClick={onNavigate}
              className={linkClass}
              activeProps={activeLink}
            >
              <LayoutDashboard className="size-4" aria-hidden />
              {t("nav.dashboard")}
            </Link>
          </li>
        </ul>
      )}
      {isSuperadmin && (
        <div>
          <SectionTitle label={t("nav.platform.section")} />
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
      {
        <div>
          <SectionTitle label={t("nav.operation.section")} />
          <div className="mb-2 flex items-center gap-2 px-3">
            <span className="shrink-0 text-[11px] text-sidebar-foreground/60">
              {t("nav.operation.companyLabel")}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2 py-0.5 text-[11px] font-medium text-sidebar-foreground/90">
              <span className="size-1.5 shrink-0 rounded-full bg-sidebar-primary" aria-hidden />
              <span className="truncate">{user?.companyName ?? user?.companyId}</span>
            </span>
          </div>
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
            {can(user, "module.connections") && (
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
            )}
            {can(user, "module.status") && (
              <li>
                <Link
                  to="/app/status"
                  onClick={onNavigate}
                  className={linkClass}
                  activeProps={activeLink}
                >
                  <ImagePlus className="size-4" aria-hidden />
                  {t("nav.modules.whatsappStatus")}
                </Link>
              </li>
            )}
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
            <li>
              <Link
                to="/app/respostas-rapidas"
                onClick={onNavigate}
                className={linkClass}
                activeProps={activeLink}
              >
                <Zap className="size-4" aria-hidden />
                {t("nav.modules.quickMessages")}
              </Link>
            </li>
            <li>
              <Link
                to="/app/chat-interno"
                onClick={onNavigate}
                className={linkClass}
                activeProps={activeLink}
              >
                <UsersRound className="size-4" aria-hidden />
                {t("nav.modules.internalChat")}
              </Link>
            </li>
            {(isSuperadmin || hasRole("company_admin")) && (
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
                <li>
                  <Link
                    to="/app/configuracoes"
                    onClick={onNavigate}
                    className={linkClass}
                    activeProps={activeLink}
                  >
                    <Settings className="size-4" aria-hidden />
                    {t("nav.modules.settings")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      }
      {!isSuperadmin && (
        <div>
          <SectionTitle label={t("nav.soon")} />
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
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto bg-sidebar py-5 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6">
        <AppLogo />
        <AppName className="text-lg" />
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <GroupFooter className="mt-auto border-t border-sidebar-border pt-3" />
    </div>
  );
}

function trialDaysLeft(due?: string | null) {
  if (!due) return null;
  return Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
}

function TrialNotice() {
  const { t } = useTranslation();
  const { user } = useSession();
  if (!user || user.role === "superadmin") return null;
  const left = trialDaysLeft(user.companyDueDate);
  if (left === null || left < 0 || left > 15) return null;
  return (
    <div
      role="note"
      className="border-b bg-muted px-4 py-1 text-center text-xs text-muted-foreground"
    >
      {t("trial.notice", { count: left })}
    </div>
  );
}

function TrialBlocked({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md space-y-4 rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">{t("trial.blockedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("trial.blockedText")}</p>
        <Button variant="outline" onClick={onLogout}>
          {t("trial.logout")}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const router = useRouter();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(DESKTOP_MENU_STORAGE_KEY) !== "false";
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleDesktopMenu = () => {
    setDesktopOpen((open) => {
      const next = !open;
      window.localStorage.setItem(DESKTOP_MENU_STORAGE_KEY, String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout(router.options.context.queryClient);
    await navigate({ to: "/login", replace: true });
  };

  const handleExit = async () => {
    await router.options.context.queryClient.cancelQueries();
    try {
      await exitCompany();
      router.options.context.queryClient.clear();
      await navigate({ to: "/app/plataforma" });
    } catch {
      // Sem sessão da plataforma guardada (ex.: recarregou a página):
      // encerra a sessão delegada com segurança e leva ao login.
      toast.info(t("context.exitRelogin"));
      await handleLogout();
    }
  };

  const left = trialDaysLeft(user?.companyDueDate);
  if (
    user &&
    user.role !== "superadmin" &&
    (user.companyActive === false || (left !== null && left < 0))
  )
    return <TrialBlocked onLogout={() => void handleLogout()} />;

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell flex h-dvh min-h-0 flex-col overflow-hidden">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      <DemoBanner />
      <TrialNotice />
      {user?.impersonated && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          <span>{t("context.impersonating", { company: user.companyName ?? user.companyId })}</span>
          <Button size="sm" variant="secondary" className="h-7" onClick={() => void handleExit()}>
            {t("context.exit")}
          </Button>
        </div>
      )}
      {user && (
        <div
          role="status"
          aria-label={t("context.label")}
          className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/60 px-3 py-1.5 text-xs sm:px-6"
        >
          <span
            className={
              user.role === "superadmin"
                ? "rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground"
                : "rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground"
            }
          >
            {user.role === "superadmin" ? t("context.platform") : t("context.company")}
          </span>
          <span className="font-medium">
            {t("context.currentCompany", { company: user.companyName ?? user.companyId })}
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            {user.role === "superadmin" ? t("context.platformMode") : t("context.companyMode")}
          </span>
          <span className="hidden text-muted-foreground md:inline">
            {t("context.user", { name: user.name })}
          </span>
          <span className="text-muted-foreground">
            {t("context.role", { role: t(`roles.${user.role}`) })}
          </span>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <aside
          aria-hidden={!desktopOpen}
          className={desktopOpen ? "hidden w-64 shrink-0 lg:block" : "hidden"}
        >
          <div className="h-full">
            <SidebarBody />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="z-30 grid h-16 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 border-b bg-background/85 px-2 backdrop-blur sm:flex sm:gap-2 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-10 shrink-0 lg:inline-flex"
              onClick={toggleDesktopMenu}
              aria-label={t(desktopOpen ? "actions.closeMenu" : "actions.openMenu")}
              aria-expanded={desktopOpen}
              title={t(desktopOpen ? "actions.closeMenu" : "actions.openMenu")}
            >
              {desktopOpen ? (
                <PanelLeftClose className="size-5" aria-hidden />
              ) : (
                <PanelLeftOpen className="size-5" aria-hidden />
              )}
            </Button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 sm:size-10 lg:hidden"
                  aria-label={t("actions.openMenu")}
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-[85vw] border-0 p-0">
                <SheetTitle className="sr-only">{t("nav.main")}</SheetTitle>
                <SidebarBody onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-1.5 lg:hidden">
              <AppLogo className="size-6 sm:size-7" />
              <AppName className="truncate text-sm sm:text-base" />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1 [&>button]:size-8 sm:[&>button]:size-10">
              <IncomingNotifications />
              <AdminAlerts />
              <SlaWatcher />
              <LanguageSelector />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 gap-2 px-1 sm:h-10 sm:px-2"
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
          <main
            id="conteudo"
            className="app-main min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8"
          >
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
