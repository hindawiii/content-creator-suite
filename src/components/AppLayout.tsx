import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, PenSquare, Image as ImageIcon, Calendar, BarChart3, Settings, Sparkles, Send } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useKeysStatus } from "@/hooks/useKeysStatus";
import { schedulesStore } from "@/services/storage";

const nav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/write", label: "كتابة", icon: PenSquare },
  { to: "/image", label: "صور", icon: ImageIcon },
  { to: "/publish", label: "نشر", icon: Send },
  { to: "/schedule", label: "جدولة", icon: Calendar },
  { to: "/analytics", label: "تحليلات", icon: BarChart3 },
  { to: "/settings", label: "إعدادات", icon: Settings },
] as const;

function useScheduleNotifier() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    const firedKey = "poston_notified_ids";
    const check = () => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      const fired: string[] = JSON.parse(localStorage.getItem(firedKey) ?? "[]");
      const items = schedulesStore.list().filter((s) => s.status === "pending");
      for (const s of items) {
        const t = new Date(s.scheduledTime).getTime();
        if (t <= now && !fired.includes(s.id)) {
          try {
            const n = new Notification("PostMind — حان وقت النشر!", {
              body: `حان وقت نشر منشورك على ${s.platform}`,
              icon: "/favicon.ico",
              tag: s.id,
            });
            n.onclick = () => { window.focus(); window.location.href = "/publish"; };
          } catch { /* ignore */ }
          fired.push(s.id);
        }
      }
      localStorage.setItem(firedKey, JSON.stringify(fired));
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);
}


function NavItem({ to, label, Icon, active, dot }: { to: string; label: string; Icon: typeof LayoutDashboard; active: boolean; dot?: string }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "gradient-primary text-white shadow-[var(--shadow-glow)]"
          : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{label}</span>
      {dot && <span className={`h-2 w-2 rounded-full ${dot} shadow-[0_0_6px_currentColor]`} />}
    </Link>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const keys = useKeysStatus();
  const dot = keys.health === "ok" ? "bg-success" : keys.health === "failed" ? "bg-warning" : "bg-destructive";

  return (
    <div dir="rtl" className="min-h-screen gradient-mesh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-border bg-surface/60 backdrop-blur-xl md:block">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">PostMind</div>
            <div className="text-[10px] text-muted-foreground">مساعد المحتوى بالذكاء</div>
          </div>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {nav.map((n) => (
            <NavItem key={n.to} to={n.to} label={n.label} Icon={n.icon} active={pathname === n.to} dot={n.to === "/settings" ? dot : undefined} />
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 rounded-xl border border-border bg-surface-elevated p-4">
          <div className="text-xs text-muted-foreground">الخطة الحالية</div>
          <div className="mt-1 font-bold">مجانية</div>
          <Link to="/settings" className="mt-2 inline-block text-xs text-accent hover:underline">
            ترقية الآن ←
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">PostMind</span>
        </div>
      </header>

      <main className="md:mr-64">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div key={pathname} className="animate-in-up">
            {children ?? <Outlet />}
          </div>
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-6">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[10px]">
                <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                <span className={active ? "text-accent" : "text-muted-foreground"}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
