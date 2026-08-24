import { Link, useNavigate } from "react-router";
import {
  BarChart2,
  Bell,
  Camera,
  ChevronRight,
  ClipboardList,
  Cpu,
  Flag,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthContext } from "@/context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";
import { VIEW_LABELS, VIEW_ROUTES } from "../constants";
import type { DashboardHeaderState } from "@/hooks/dashboard/useDashboardHeader";
import type { AppUser, ViewName } from "../types";

const VIEW_ICONS: Record<ViewName, LucideIcon> = {
  dashboard: LayoutDashboard,
  machines: Cpu,
  workorders: ClipboardList,
  faults: Flag,
  repairs: Camera,
  analytics: BarChart2,
  finance: Receipt,
  notifications: Bell,
  users: Users,
  roles: Shield,
};

const VIEW_DESCRIPTIONS: Partial<Record<ViewName, string>> = {
  dashboard: "Fleet overview and daily maintenance summary",
  machines: "Registry, status, and machine details",
  workorders: "Assign, track, and close work orders",
  faults: "Fault reports — report machine problems and track them",
  repairs: "Historical repair logs and photos",
  analytics: "Cost trends and performance metrics",
  finance: "Work order costs and budget tracking",
  notifications: "Alerts and activity updates",
  users: "Manage team members, roles, and site access",
  roles: "Create roles and assign permissions to users",
};

function userInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface DashboardHeaderProps {
  view: ViewName;
  currentUser: AppUser;
  unreadCount: number;
  openFaultCount: number;
  header: DashboardHeaderState;
  onOpenNav: () => void;
}

export function DashboardHeader({
  view,
  currentUser,
  unreadCount,
  openFaultCount,
  header,
  onOpenNav,
}: DashboardHeaderProps) {
  const { logout, user: authUser } = useAuthContext();
  const navigate = useNavigate();
  const {
    isOnline,
    isAway,
    searchRef,
    searchPanelRef,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectSearchResult,
    showSearchResults,
    openSearch,
  } = header;

  const PageIcon = VIEW_ICONS[view];
  const displayName = authUser?.name ?? currentUser.name;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 lg:px-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 lg:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <nav className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="hidden font-medium sm:inline">MachineTrack</span>
            <ChevronRight className="hidden size-3 sm:inline" />
            <span className="font-medium text-foreground/80">
              {VIEW_LABELS[view]}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              {view === "finance" ? (
                <span className="text-sm font-bold leading-none">৳</span>
              ) : (
                <PageIcon className="size-4.5" strokeWidth={2.25} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {VIEW_LABELS[view]}
              </h1>
              <p className="hidden text-xs leading-relaxed text-muted-foreground sm:block">
                {VIEW_DESCRIPTIONS[view] ??
                  `${currentUser.site} · ${currentUser.role}`}
              </p>
            </div>
          </div>
        </div>

        <div
          ref={searchPanelRef}
          className="relative hidden max-w-xs flex-1 md:block lg:max-w-sm"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={openSearch}
              placeholder="Search machines, work orders…"
              className="h-9 w-full rounded-lg border border-border bg-background/80 pl-9 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Search"
              aria-expanded={showSearchResults}
              aria-controls="dashboard-global-search"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
              Ctrl K
            </kbd>
          </div>

          {showSearchResults && (
            <div
              id="dashboard-global-search"
              className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            >
              {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching…
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchResults.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => selectSearchResult(item)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <span className="mt-0.5 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {item.type}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  No results for “{searchQuery}”
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide lg:flex",
              !isOnline
                ? "border-border bg-muted text-muted-foreground"
                : isAway
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                !isOnline
                  ? "bg-muted-foreground"
                  : isAway
                    ? "bg-amber-500"
                    : "animate-pulse bg-emerald-500",
              )}
            />
            {!isOnline ? "Offline" : isAway ? "Away" : "Online"}
          </div>

          {openFaultCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 sm:inline-flex"
              onClick={() => navigate(VIEW_ROUTES.faults)}
            >
              <Flag className="size-3.5" />
              {openFaultCount} open fault report{openFaultCount > 1 ? "s" : ""}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="relative size-9"
            onClick={() => navigate(VIEW_ROUTES.notifications)}
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 pl-1.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {userInitials(displayName)}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[120px] truncate text-xs font-semibold leading-tight">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] font-mono text-muted-foreground">
                    {currentUser.role}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {authUser?.email ?? "Signed in"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/users" className="cursor-pointer">
                  <User className="size-4" />
                  User management
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
