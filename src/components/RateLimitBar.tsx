import { useQuota } from "@/hooks/useRateLimit";

export function RateLimitBar({ kind = "post" }: { kind?: "post" | "image" }) {
  const { quota } = useQuota();
  const q = kind === "post" ? quota.posts : quota.images;
  const isInfinite = q.max === Infinity;
  const remaining = isInfinite ? "∞" : Math.max(0, q.max - q.used);
  const pct = isInfinite ? 100 : Math.min(100, (q.used / q.max) * 100);
  const label = kind === "post" ? "منشورات" : "صور";
  const nearLimit = !isInfinite && q.used / q.max >= 0.8;

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-3 text-xs">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-muted-foreground">
          الحصة اليومية — {label} ({quota.plan === "pro" ? "Pro" : "Free"})
        </span>
        <span className={nearLimit ? "font-bold text-warning" : "font-semibold"}>
          {isInfinite ? "غير محدود" : `${q.used} / ${q.max}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full transition-all ${nearLimit ? "bg-warning" : "gradient-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        المتبقي اليوم: <strong className="text-foreground">{remaining}</strong>
      </div>
    </div>
  );
}
