import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  PageHeader,
  Button,
  Textarea,
  Select,
  Label,
  Input,
  Badge,
  EmptyState,
} from "@/components/ui";
import { PLATFORM_META, type Platform } from "@/lib/store";
import { schedulesStore, type ScheduleRecord } from "@/services/storage";
import {
  Calendar as CalIcon,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Bell,
  BellOff,
  CheckCircle2,
} from "lucide-react";
import { usePushReminders } from "@/hooks/usePushReminders";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Post On — جدولة المحتوى" },
      { name: "description", content: "خطط لمنشوراتك ونظّم تقويم المحتوى بسهولة." },
      { property: "og:title", content: "جدولة المحتوى — Post On" },
      { property: "og:description", content: "تقويم شهري لإدارة كل منشوراتك المجدولة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

interface SchedItem {
  id: string;
  platform: Platform;
  scheduledAt: string;
  content: string;
}

function SchedulePage() {
  const [records, setRecords] = useState<ScheduleRecord[]>([]);
  const refresh = () => setRecords(schedulesStore.list());
  useEffect(refresh, []);
  const [month, setMonth] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [datetime, setDatetime] = useState("");
  const push = usePushReminders();

  const scheduled: SchedItem[] = records
    .filter((s) => s.status === "pending" && s.platform in PLATFORM_META)
    .map((s) => ({
      id: s.id,
      platform: s.platform as Platform,
      scheduledAt: s.scheduledTime,
      content: s.content ?? "",
    }))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const missedCount = scheduled.filter(
    (p) => new Date(p.scheduledAt!).getTime() <= Date.now(),
  ).length;
  const removePost = (id: string) => {
    schedulesStore.remove(id);
    refresh();
  };
  const updatePost = (id: string, _p: { status: "published" }) => {
    schedulesStore.update(id, { status: "sent" });
    refresh();
  };

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const startDow = first.getDay();
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    return cells;
  }, [month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, SchedItem[]>();
    for (const p of scheduled) {
      const d = new Date(p.scheduledAt!);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return map;
  }, [scheduled]);

  const handleAdd = () => {
    if (!content.trim() || !datetime) return;
    const id = crypto.randomUUID();
    schedulesStore.add({
      postId: id,
      platform,
      scheduledTime: new Date(datetime).toISOString(),
      status: "pending",
      content,
    });
    refresh();
    setContent("");
    setDatetime("");
    setOpen(false);
  };

  const monthLabel = month.toLocaleDateString("ar", { month: "long", year: "numeric" });
  const dow = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  return (
    <AppLayout>
      <PageHeader
        title="جدولة المحتوى"
        subtitle="خطط لمنشوراتك على كل المنصات من مكان واحد"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> منشور مجدول
          </Button>
        }
      />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            {push.state === "on" ? (
              <Bell className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <BellOff className="h-4 w-4 shrink-0 text-warning" />
            )}
            <span>
              {push.state === "on"
                ? "التذكيرات مفعّلة على هذا الجهاز — تصلك عند موعد كل منشور حتى لو كان التطبيق مغلقًا."
                : push.state === "signed-out"
                  ? "سجّل الدخول لتصلك التذكيرات حتى والتطبيق مغلق. الآن تصلك فقط أثناء فتح التطبيق."
                  : push.state === "denied"
                    ? "التنبيهات محجوبة من المتصفح — فعّلها من إعدادات الموقع لتصلك التذكيرات."
                    : push.state === "unsupported"
                      ? "متصفحك لا يدعم التذكيرات في الخلفية. على آيفون: أضف التطبيق إلى الشاشة الرئيسية أولًا."
                      : "فعّل التذكيرات لتصلك عند موعد كل منشور حتى لو كان التطبيق مغلقًا."}
            </span>
          </div>
          {push.state === "signed-out" && (
            <Link to="/auth">
              <Button variant="outline">تسجيل الدخول</Button>
            </Link>
          )}
          {push.state === "off" && (
            <Button
              variant="outline"
              disabled={push.busy}
              onClick={async () => {
                try {
                  if (await push.enable()) toast.success("تم تفعيل التذكيرات على هذا الجهاز");
                } catch {
                  toast.error("تعذّر تفعيل التذكيرات — حاول مرة أخرى");
                }
              }}
            >
              <Bell className="h-4 w-4" /> تفعيل التذكيرات
            </Button>
          )}
          {push.state === "on" && (
            <Button variant="ghost" disabled={push.busy} onClick={() => push.disable()}>
              إيقاف
            </Button>
          )}
        </div>
        {missedCount > 0 && (
          <p className="mt-2 text-sm text-warning">
            ⏰ لديك {missedCount} منشوراً حان وقته ولم يُنشر بعد — راجع القائمة أدناه.
          </p>
        )}
      </Card>

      <div className="mt-5" />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-lg p-2 hover:bg-surface-elevated"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="font-bold">{monthLabel}</div>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-lg p-2 hover:bg-surface-elevated"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
          {dow.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
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
                className={`min-h-[72px] rounded-lg border p-1.5 text-sm ${
                  isToday ? "border-accent bg-accent/10" : "border-border bg-surface-elevated"
                }`}
              >
                <div
                  className={`mb-1 font-semibold ${isToday ? "text-accent" : "text-muted-foreground"}`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {items.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="truncate rounded px-1 py-0.5 text-sm"
                      style={{ background: `${PLATFORM_META[p.platform].color}33` }}
                    >
                      {PLATFORM_META[p.platform].emoji} {p.content.slice(0, 20)}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-sm text-muted-foreground">+{items.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold">قائمة المجدولة</h2>
        {scheduled.length === 0 ? (
          <EmptyState
            icon={<CalIcon className="h-8 w-8 opacity-40" />}
            title="لا توجد منشورات مجدولة"
            hint="أضف منشوراً جديداً لتراه هنا"
          />
        ) : (
          <div className="space-y-2">
            {scheduled.map((p) => {
              const meta = PLATFORM_META[p.platform];
              const d = new Date(p.scheduledAt!);
              const isMissed = d.getTime() <= Date.now();
              return (
                <Card key={p.id} className={`!p-3 ${isMissed ? "border-warning/60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${meta.color}22` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge tone="accent">
                          {d.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })}
                        </Badge>
                        {isMissed && (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-sm font-semibold text-warning">
                            حان وقته
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMissed && (
                        <button
                          onClick={() => updatePost(p.id, { status: "published" })}
                          title="تم النشر"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removePost(p.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-overlay/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">إضافة منشور مجدول</h3>
            <div className="space-y-3">
              <div>
                <Label>المنصة</Label>
                <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                  {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_META[p].emoji} {PLATFORM_META[p].label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>المحتوى</Label>
                <Textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب منشورك..."
                />
              </div>
              <div>
                <Label>التاريخ والوقت</Label>
                <Input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  إلغاء
                </Button>
                <Button onClick={handleAdd} className="flex-1">
                  جدولة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
