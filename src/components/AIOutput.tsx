import { Copy, RefreshCw, Scissors, Maximize2, Megaphone, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Textarea, Badge } from "@/components/ui";
import { useRewrite } from "@/hooks/useAI";

export function AIOutput({
  value,
  onChange,
  onSave,
  source,
  saved,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave?: () => void;
  source?: "groq" | "together" | "fallback";
  saved?: boolean;
}) {
  const { run, loading } = useRewrite();

  const apply = async (kind: "rewrite" | "shorten" | "expand" | "cta", tone?: string) => {
    const next = await run(kind, value, tone);
    if (next) onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {source && (
            <Badge tone={source === "fallback" ? "warning" : "accent"}>
              {source === "groq" ? "Groq" : source === "together" ? "Together AI" : "قالب محلي"}
            </Badge>
          )}
          {saved && <Badge tone="success">تم الحفظ</Badge>}
        </div>
      </div>

      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={10} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(value); toast.success("نُسخ النص"); }}>
          <Copy className="h-4 w-4" /> نسخ
        </Button>
        <Button variant="outline" disabled={loading} onClick={() => apply("rewrite", "friendly")}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> إعادة صياغة
        </Button>
        <Button variant="outline" disabled={loading} onClick={() => apply("shorten")}>
          <Scissors className="h-4 w-4" /> اختصار
        </Button>
        <Button variant="outline" disabled={loading} onClick={() => apply("expand")}>
          <Maximize2 className="h-4 w-4" /> توسيع
        </Button>
        <Button variant="outline" disabled={loading} onClick={() => apply("cta")}>
          <Megaphone className="h-4 w-4" /> إضافة CTA
        </Button>
        {onSave && (
          <Button onClick={onSave}>
            <Save className="h-4 w-4" /> حفظ كمسودة
          </Button>
        )}
      </div>
    </div>
  );
}
