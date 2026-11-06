import { Link, useRouterState } from "@tanstack/react-router";
import { Image as ImageIcon, Type, Wand2 } from "lucide-react";

const tabs = [
  { to: "/image", label: "توليد بالذكاء", icon: ImageIcon },
  { to: "/tools", label: "أدوات", icon: Wand2 },
  { to: "/editor", label: "المحرر", icon: Type },
] as const;

/** Shared switcher that joins image generation and image tools into one Design Studio. */
export function StudioTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="استوديو التصميم" className="mb-5 flex gap-1 rounded-full border border-border bg-surface p-1">
      {tabs.map((t) => {
        const active = pathname === t.to;
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors ${
              active ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
