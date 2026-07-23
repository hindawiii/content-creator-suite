import { toast } from "sonner";
import { Copy } from "lucide-react";

export function HashtagList({ tags, onCopyAll }: { tags: string[]; onCopyAll?: () => void }) {
  if (!tags?.length) return null;
  const copyOne = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success(`نُسخ: ${t}`);
  };
  const copyAll = () => {
    navigator.clipboard.writeText(tags.join(" "));
    toast.success("نُسخت كل الهاشتاقات");
    onCopyAll?.();
  };
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">الهاشتاقات المقترحة</span>
        <button onClick={copyAll} className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
          <Copy className="h-3 w-3" /> نسخ الكل
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => copyOne(t)}
            className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] transition hover:border-accent hover:text-accent"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
