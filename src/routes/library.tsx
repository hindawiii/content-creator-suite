import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Input, Badge } from "@/components/ui";
import { Copy, Send, Trash2, Search, Sparkles, FileText } from "lucide-react";
import { postsStore, setPreviewDraft, type PostRecord } from "@/services/storage";
import { PLATFORM_META, TONE_META, type Platform, type Tone } from "@/lib/store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Post On — مكتبة المنشورات" },
      { name: "description", content: "كل مسوداتك ومنشوراتك المحفوظة في مكان واحد — ابحث، انسخ، أعد النشر بضغطة زر." },
      { property: "og:title", content: "المكتبة — Post On" },
      { property: "og:description", content: "أرشيف المنشورات المحلي داخل متصفحك." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PostRecord[]>(() => postsStore.list());
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (platform !== "all" && p.platform !== platform) return false;
      if (!q.trim()) return true;
      const hay = (p.content + " " + (p.hashtags ?? []).join(" ")).toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [items, q, platform]);

  const remove = (id: string) => {
    postsStore.remove(id);
    setItems(postsStore.list());
    toast.success("تم الحذف");
  };

  const copy = async (p: PostRecord) => {
    const text = p.content + (p.hashtags?.length ? "\n\n" + p.hashtags.join(" ") : "");
    await navigator.clipboard.writeText(text);
    toast.success("نُسخ المحتوى");
  };

  const publish = (p: PostRecord) => {
    setPreviewDraft({ text: p.content, hashtags: p.hashtags ?? [] });
    navigate({ to: "/publish" });
  };

  return (
    <AppLayout>
      <PageHeader
        title="مكتبة المنشورات"
        subtitle={`${items.length} منشور محفوظ محلياً في متصفحك`}
        action={
          <Link to="/write">
            <Button><Sparkles className="h-4 w-4" /> منشور جديد</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في المنشورات أو الهاشتاقات..."
              className="pr-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPlatform("all")}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                platform === "all" ? "border-accent bg-accent/10" : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
              }`}
            >
              الكل
            </button>
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const m = PLATFORM_META[p];
              const active = platform === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    active ? "border-accent bg-accent/10" : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
                  }`}
                  title={m.label}
                >
                  <span className="text-sm">{m.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <FileText className="h-10 w-10 text-accent opacity-60" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? "لا يوجد منشورات محفوظة بعد — ابدأ بتوليد منشور." : "لا توجد نتائج مطابقة."}
            </p>
            {items.length === 0 && (
              <Link to="/write"><Button>كتابة منشور</Button></Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => {
            const m = PLATFORM_META[p.platform as Platform];
            const toneLabel = TONE_META[p.tone as Tone] ?? p.tone;
            return (
              <Card key={p.id} className="flex flex-col animate-in-up">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lg">{m?.emoji ?? "📝"}</span>
                    <span className="font-semibold">{m?.label ?? p.platform}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{toneLabel}</span>
                    {p.aiGenerated ? <Badge tone="accent">AI</Badge> : <Badge tone="warning">قالب</Badge>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                  </span>
                </div>

                <p className="mb-3 whitespace-pre-wrap text-sm leading-7 line-clamp-6">{p.content}</p>

                {p.hashtags && p.hashtags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {p.hashtags.slice(0, 6).map((t) => (
                      <span key={t} className="rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                    {p.hashtags.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">+{p.hashtags.length - 6}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button onClick={() => publish(p)}><Send className="h-4 w-4" /> نشر</Button>
                  <Button variant="outline" onClick={() => copy(p)}><Copy className="h-4 w-4" /> نسخ</Button>
                  <Button variant="outline" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" /> حذف
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
