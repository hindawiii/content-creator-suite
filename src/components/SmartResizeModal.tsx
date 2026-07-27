import { useEffect, useState } from "react";
import { X, Check, RefreshCw, Scissors, Maximize2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PLATFORM_LIMITS, sweetStatus } from "@/utils/platformLimits";
import type { Platform } from "@/lib/store";

export function SmartResizeModal({
  open,
  mode,
  platform,
  original,
  result,
  loading,
  onRetry,
  onApply,
  onClose,
}: {
  open: boolean;
  mode: "shorten" | "expand";
  platform: Platform;
  original: string;
  result: string | null;
  loading: boolean;
  onRetry: () => void;
  onApply: (text: string) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState<string>(result ?? "");
  useEffect(() => { setEdited(result ?? ""); }, [result]);

  if (!open) return null;

  const limit = PLATFORM_LIMITS[platform];
  const origLen = original.length;
  const newLen = edited.length;
  const s = edited ? sweetStatus(edited, platform) : "over";
  const badgeMap = {
    ideal: { tone: "success" as const, label: "مثالي ✅" },
    short: { tone: "warning" as const, label: "قصير" },
    long: { tone: "warning" as const, label: "طويل" },
    over: { tone: "warning" as const, label: "يتجاوز الحد ✗" },
  };

  const Icon = mode === "shorten" ? Scissors : Maximize2;
  const title = mode === "shorten" ? "اختصار ذكي" : "توسيع ذكي";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in-up" onClick={onClose}>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent" />
            <h3 className="text-base font-bold">{title}</h3>
            <Badge tone="accent">{platform}</Badge>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">الأصلي</span>
              <span className="text-[11px] text-muted-foreground">{origLen}/{limit}</span>
            </div>
            <div className="max-h-[50vh] overflow-auto rounded-xl border border-border bg-input p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {original}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-accent">
                {mode === "shorten" ? "المختصر ✨" : "الموسّع ✨"}
              </span>
              <div className="flex items-center gap-2">
                {edited && <Badge tone={badgeMap[s].tone}>{badgeMap[s].label}</Badge>}
                <span className={`text-[11px] ${newLen > limit ? "text-destructive" : "text-muted-foreground"}`}>
                  {newLen}/{limit}
                </span>
              </div>
            </div>
            {loading ? (
              <div className="flex h-[50vh] items-center justify-center rounded-xl border border-dashed border-border">
                <RefreshCw className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : (
              <textarea
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                className="max-h-[50vh] min-h-[220px] w-full resize-y rounded-xl border border-accent/40 bg-input p-3 text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-elevated/30 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="outline" onClick={onRetry} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> أعد المحاولة
          </Button>
          <Button onClick={() => edited && onApply(edited)} disabled={!edited || loading}>
            <Check className="h-4 w-4" /> {mode === "shorten" ? "استخدم المختصر" : "استخدم الموسّع"}
          </Button>
        </div>
      </div>
    </div>
  );
}
