import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Select, Label, Input, Badge, EmptyState } from "@/components/ui";
import { PLATFORM_META, useStore, type Platform } from "@/lib/store";
import { Calendar as CalIcon, Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "PostMind — جدولة المحتوى" },
      { name: "description", content: "خطط لمنشوراتك ونظّم تقويم المحتوى بسهولة." },
      { property: "og:title", content: "جدولة المحتوى — PostMind" },
      { property: "og:description", content: "تقويم شهري لإدارة كل منشوراتك المجدولة." },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { posts, addPost, removePost } = useStore();
  const [month, setMonth] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [datetime, setDatetime] = useState("");

  const scheduled = posts.filter((p) => p.status === "scheduled" && p.scheduledAt);

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const startDow = first.getDay();
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    return cells;
  }, [month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, typeof posts>();
    for (const p of scheduled) {
      const d = new Date(p.scheduledAt!);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return map;
  }, [scheduled]);

  const handleAdd = () => {
    if (!content.trim() || !datetime) return;
    addPost({ content, platform, tone: "professional", topic: "", status: "scheduled", scheduledAt: new Date(datetime).toISOString() });
    setContent(""); setDatetime(""); setOpen(false);
  };

  const monthLabel = month.toLocaleDateString("ar", { month: "long", year: "numeric" });
  const dow = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  return (
    <AppLayout>
      <PageHeader
        title="جدولة المحتوى"
        subtitle="خطط لمنشوراتك على كل المنصات من مكان واحد"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> منشور مجدول</Button>}
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-surface-elevated">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="font-bold">{monthLabel}</div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-surface-elevated">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {dow.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const items = postsByDay.get(key) ?? [];
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`min-h-[72px] rounded-lg border p-1.5 text-xs ${
                  isToday ? "border-accent bg-accent/10" : "border-border bg-surface-elevated"
                }`}
              >
                <div className={`mb-1 font-semibold ${isToday ? "text-accent" : "text-muted-foreground"}`}>{d.getDate()}</div>
                <div className="space-y-0.5">
                  {items.slice(0, 2).map((p) => (
                    <div key={p.id} className="truncate rounded px-1 py-0.5 text-[10px]" style={{ background: `${PLATFORM_META[p.platform].color}33` }}>
                      {PLATFORM_META[p.platform].emoji} {p.content.slice(0, 20)}
                    </div>
                  ))}
                  {items.length > 2 && <div className="text-[9px] text-muted-foreground">+{items.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold">قائمة المجدولة</h2>
        {scheduled.length === 0 ? (
          <EmptyState icon={<CalIcon className="h-8 w-8 opacity-40" />} title="لا توجد منشورات مجدولة" hint="أضف منشوراً جديداً لتراه هنا" />
        ) : (
          <div className="space-y-2">
            {scheduled.map((p) => {
              const meta = PLATFORM_META[p.platform];
              const d = new Date(p.scheduledAt!);
              return (
                <Card key={p.id} className="!p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg" style={{ background: `${meta.color}22` }}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge tone="accent">{d.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.content}</p>
                    </div>
                    <button onClick={() => removePost(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">إضافة منشور مجدول</h3>
            <div className="space-y-3">
              <div>
                <Label>المنصة</Label>
                <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                  {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                    <option key={p} value={p}>{PLATFORM_META[p].emoji} {PLATFORM_META[p].label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>المحتوى</Label>
                <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="اكتب منشورك..." />
              </div>
              <div>
                <Label>التاريخ والوقت</Label>
                <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">إلغاء</Button>
                <Button onClick={handleAdd} className="flex-1">جدولة</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
