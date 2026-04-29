import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, PlusCircle, MapPin, User } from "lucide-react";
import { FlowSpringLogo } from "./FlowSpringLogo";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { ErrorBoundary } from "./ErrorBoundary";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/report", label: "Report", icon: PlusCircle },
  { to: "/map", label: "Map", icon: MapPin },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnlineStatus();
  useOfflineSync();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {!online && (
        <div
          role="status"
          className="fixed top-0 inset-x-0 z-[60] bg-warning text-warning-foreground text-center text-sm py-1.5 font-medium shadow"
          style={{ backgroundColor: "#FB8C00", color: "#fff" }}
        >
          You're offline — reports will sync when you're back online
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-surface lg:p-6 lg:gap-2">
        <div className="flex items-center gap-3 mb-8">
          <FlowSpringLogo size={40} />
          <div>
            <div className="font-bold text-lg text-primary">FlowSpring</div>
            <div className="text-xs text-muted-foreground">SDG 6</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Tablet top tab bar */}
      <div className="hidden md:flex lg:hidden border-b bg-surface">
        <div className="flex items-center gap-3 px-4">
          <FlowSpringLogo size={28} />
          <span className="font-bold text-primary">FlowSpring</span>
        </div>
        <nav className="flex flex-1 justify-around">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 fs-main-pad">
        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 md:hidden bg-background border-t flex justify-around z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 flex-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}