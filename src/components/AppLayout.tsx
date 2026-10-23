import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PenSquare,
  Image as ImageIcon,
  Calendar,
  BarChart3,
  Settings,
  Send,
  Library,
  Video,
  Ellipsis,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useKeysStatus } from "@/hooks/useKeysStatus";
import { useScheduleAlerts } from "@/hooks/useScheduleAlerts";
import { Button } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/post-on-logo.png";

const nav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/write", label: "كتابة", icon: PenSquare },
  { to: "/image", label: "صور", icon: ImageIcon },
  { to: "/video", label: "فيديو", icon: Video },
  { to: "/library", label: "المكتبة", icon: Library },
  { to: "/publish", label: "نشر", icon: Send },
  { to: "/schedule", label: "جدولة", icon: Calendar },
  { to: "/analytics", label: "تحليلات", icon: BarChart3 },
  { to: "/settings", label: "إعدادات", icon: Settings },
] as const;

function NavItem({
  to,
  label,
  Icon,
  active,
  dot,
}: {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  active: boolean;
  dot?: string;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
          : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{label}</span>
      {dot && <span className={`h-2 w-2 rounded-full ${dot} `} />}
    </Link>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryNav = nav.filter((n) => ["/", "/write", "/image", "/video", "/library", "/publish"].includes(n.to));
  const moreNav = nav.filter((n) => n.to !== "/settings" && !primaryNav.some((item) => item.to === n.to));
  const moreActive = moreNav.some((n) => pathname === n.to) || ["/privacy", "/terms"].includes(pathname);
  const keys = useKeysStatus();
  const dot =
    keys.health === "ok"
      ? "bg-success"
      : keys.health === "failed"
        ? "bg-warning"
        : "bg-destructive";
  useScheduleAlerts();

  return (
    <div dir="rtl" className="min-h-screen gradient-mesh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 right-0 hidden w-64 flex-col overflow-y-auto border-l border-border bg-surface md:flex">
        <Link to="/" aria-label="Post On — الرئيسية" className="flex h-20 shrink-0 items-center px-6">
          <img src={logo} alt="Post On" width={1367} height={412} className="h-auto w-full object-contain" />
        </Link>
        <nav className="mt-4 space-y-1 px-3">
          {nav.map((n) => (
            <NavItem
              key={n.to}
              to={n.to}
              label={n.label}
              Icon={n.icon}
              active={pathname === n.to}
              dot={n.to === "/settings" ? dot : undefined}
            />
          ))}
        </nav>
        <div className="mx-3 mt-auto pb-4 pt-8">
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="text-sm text-muted-foreground">الخطة الحالية</div>
            <div className="mt-1 font-bold">مجانية</div>
            <Link to="/settings" className="mt-2 inline-block text-sm text-accent hover:underline">
              ترقية الآن ←
            </Link>
          </div>
          <div className="mt-3 flex justify-center gap-3 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              الخصوصية
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              الشروط
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Link to="/" aria-label="Post On — الرئيسية" className="flex h-10 w-36 items-center">
          <img src={logo} alt="Post On" width={1367} height={412} className="h-auto w-full object-contain" />
        </Link>
        <Link
          to="/settings"
          aria-label={keys.health === "ok" ? "الإعدادات — المفاتيح متصلة" : "الإعدادات — أضف مفاتيح الذكاء الاصطناعي"}
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors ${
            pathname === "/settings" ? "bg-surface-elevated text-accent" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className={`absolute -top-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dot}`} />
        </Link>
      </header>

      <main className="md:mr-64">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div key={pathname} className="animate-in-up">
            {children ?? <Outlet />}
          </div>
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav aria-label="القائمة الرئيسية" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-7">
          {primaryNav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className="flex min-w-0 flex-col items-center gap-1 py-2 text-xs font-semibold"
              >
                <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                <span className={`max-w-full truncate ${active ? "text-accent" : "text-muted-foreground"}`}>{n.label}</span>
              </Link>
            );
          })}
          <Button variant="ghost" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen} className={`flex min-h-[72px] flex-col gap-1 rounded-none px-1 py-2 text-xs font-semibold ${moreActive ? "!text-accent" : ""}`}>
            <Ellipsis className="h-5 w-5" />
            <span>المزيد</span>
          </Button>
        </div>
      </nav>
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent dir="rtl" aria-describedby={undefined} className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg p-5">
          <DialogTitle className="mb-2 text-right">المزيد</DialogTitle>
          <nav aria-label="أقسام إضافية" className="grid gap-2" onClick={() => setMoreOpen(false)}>
            {moreNav.map((n) => <NavItem key={n.to} to={n.to} label={n.label} Icon={n.icon} active={pathname === n.to} dot={n.to === "/settings" ? dot : undefined} />)}
          </nav>
          <div className="flex justify-center gap-6 border-t border-border pt-4 text-sm">
            <Link to="/privacy" onClick={() => setMoreOpen(false)} className="text-muted-foreground hover:text-foreground">الخصوصية</Link>
            <Link to="/terms" onClick={() => setMoreOpen(false)} className="text-muted-foreground hover:text-foreground">الشروط</Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
