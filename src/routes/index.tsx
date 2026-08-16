import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Badge, Button, EmptyState } from "@/components/ui";
import { useStore, PLATFORM_META } from "@/lib/store";
import { RateLimitBar } from "@/components/RateLimitBar";
import { useKeysStatus } from "@/hooks/useKeysStatus";
import { postsStore, imagesStore, publishesStore, type PostRecord, type ImageRecord, type PublishRecord } from "@/services/storage";
import {
  FileText, Image as ImageIcon, CalendarClock, Send, PenSquare, Sparkles,
  Library, BarChart3, AlertTriangle, CheckCircle2, Clock, KeyRound,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Post On — لوحة التحكم" },
      { name: "description", content: "لوحة تحكم Post On: إحصائيات محتواك، مجدولاتك القادمة، وإجراءات سريعة للكتابة والتصميم والنشر." },
      { property: "og:title", content: "Post On — لوحة التحكم" },
      { property: "og:description", content: "تابع منشوراتك وصورك ومجدولاتك، وابدأ الكتابة بالذكاء الاصطناعي في ثواني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, tone, hint }: { icon: typeof FileText; label: string; value: string | number; tone: string; hint?: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: tone }} />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${tone}22`, color: tone }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          {hint && <div className="truncate text-[10px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

function untilLabel(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "حان وقته";
  const m = Math.round(diff / 60000);
  if (m < 60) return `بعد ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `بعد ${h} ساعة`;
  return `بعد ${Math.round(h / 24)} يوم`;
}

export function Dashboard() {
  const { posts, images } = useStore();
  const keys = useKeysStatus();
  const [lib, setLib] = useState<PostRecord[]>([]);
  const [libImages, setLibImages] = useState<ImageRecord[]>([]);
  const [publishes, setPublishes] = useState<PublishRecord[]>([]);

  useEffect(() => {
    setLib(postsStore.list());
    setLibImages(imagesStore.list());
    setPublishes(publishesStore.list());
  }, []);

  const scheduled = useMemo(
    () =>
      posts
        .filter((p) => p.status === "scheduled" && p.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()),
    [posts],
  );
  const missed = scheduled.filter((p) => new Date(p.scheduledAt!).getTime() <= Date.now());
  const totalPosts = posts.length + lib.length;
  const totalImages = images.length + libImages.length;

  const today = new Date().toISOString().slice(0, 10);
  const publishedToday = publishes.filter((r) => r.publishedAt.slice(0, 10) === today).length;

  const recent = useMemo(() => {
    const a = posts.map((p) => ({ id: p.id, content: p.content, platform: p.platform as string, createdAt: p.createdAt, status: p.status }));
    const b = lib.map((p) => ({ id: p.id, content: p.content, platform: p.platform, createdAt: p.createdAt, status: "draft" as const }));
    return [...a, ...b].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()).slice(0, 5);
  }, [posts, lib]);

  return (
    <AppLayout>
      <PageHeader
        title="أهلاً بك في Post On 👋"
        subtitle="مساعدك الذكي لصناعة محتوى استثنائي عبر كل المنصات"
        action={
          <Link to="/write" className="hidden md:block">
            <Button><PenSquare className="h-4 w-4" /> منشور جديد</Button>
          </Link>
        }
      />

      {keys.health !== "ok" && (
        <Card className="mb-4 !p-4 border-warning/40">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-warning" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">فعّل مفاتيح الذكاء الاصطناعي</div>
              <div className="text-xs text-muted-foreground">أضف مفتاح Groq أو Together لتوليد المنشورات والصور بجودة عالية.</div>
            </div>
            <Link to="/settings"><Button variant="outline">الإعدادات</Button></Link>
          </div>
        </Card>
      )}

      {missed.length > 0 && (
        <Card className="mb-4 !p-4 border-destructive/40">
          <div className="flex items-center gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <span className="font-semibold">{missed.length} منشور</span> حان وقت نشره ولم يُنشر بعد.
            </div>
            <Link to="/schedule"><Button variant="outline">مراجعة</Button></Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={FileText} label="إجمالي المنشورات" value={totalPosts} tone="#e94560" hint={`${lib.length} في المكتبة`} />
        <Stat icon={ImageIcon} label="الصور المولّدة" value={totalImages} tone="#a855f7" />
        <Stat icon={CalendarClock} label="مجدولة" value={scheduled.length} tone="#3b82f6" hint={missed.length ? `${missed.length} فائتة` : undefined} />
        <Stat icon={Send} label="نُشرت اليوم" value={publishedToday} tone="#22c55e" hint={`${publishes.length} إجمالاً`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RateLimitBar kind="post" />
        <RateLimitBar kind="image" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link to="/write" className="md:col-span-2">
          <Card className="group h-full cursor-pointer transition hover:border-accent">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-primary">
                <PenSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold">اكتب منشوراً بالذكاء الاصطناعي</div>
                <div className="mt-0.5 text-xs text-muted-foreground">اختر المنصة والنبرة واللهجة، واحصل على منشور جاهز في ثواني</div>
              </div>
              <Sparkles className="h-5 w-5 text-accent transition group-hover:scale-110" />
            </div>
          </Card>
        </Link>
        <Link to="/image">
          <Card className="h-full cursor-pointer transition hover:border-accent">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-2/20 text-accent-2">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold">صمّم صورة</div>
                <div className="text-xs text-muted-foreground">توليد صور بأبعاد مختلفة</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Link to="/publish">
          <Card className="!p-4 text-center transition hover:border-accent">
            <Send className="mx-auto h-5 w-5 text-accent" />
            <div className="mt-1.5 text-xs font-semibold">نشر</div>
          </Card>
        </Link>
        <Link to="/library">
          <Card className="!p-4 text-center transition hover:border-accent">
            <Library className="mx-auto h-5 w-5 text-accent-2" />
            <div className="mt-1.5 text-xs font-semibold">المكتبة</div>
          </Card>
        </Link>
        <Link to="/analytics">
          <Card className="!p-4 text-center transition hover:border-accent">
            <BarChart3 className="mx-auto h-5 w-5 text-success" />
            <div className="mt-1.5 text-xs font-semibold">تحليلات</div>
          </Card>
        </Link>
      </div>

      {scheduled.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">المجدولات القادمة</h2>
            <Link to="/schedule"><Button variant="ghost">الجدولة ←</Button></Link>
          </div>
          <div className="space-y-3">
            {scheduled.slice(0, 3).map((p) => {
              const meta = PLATFORM_META[p.platform];
              const isMissed = new Date(p.scheduledAt!).getTime() <= Date.now();
              return (
                <Card key={p.id} className={`!p-4 ${isMissed ? "border-destructive/40" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: `${meta.color}22` }}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge tone={isMissed ? "warning" : "accent"}>
                          <Clock className="mr-1 inline h-3 w-3" /> {untilLabel(p.scheduledAt!)}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر النشاط</h2>
          <Link to="/library"><Button variant="ghost">عرض الكل ←</Button></Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="لا يوجد محتوى بعد"
            hint="ابدأ بكتابة أول منشور لك بالذكاء الاصطناعي من صفحة الكتابة."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((p) => {
              const meta = PLATFORM_META[p.platform as keyof typeof PLATFORM_META] ?? { label: p.platform, color: "#888", emoji: "📝" };
              return (
                <Card key={p.id} className="!p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: `${meta.color}22` }}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge tone={p.status === "published" ? "success" : p.status === "scheduled" ? "accent" : "default"}>
                          {p.status === "published" ? "منشور" : p.status === "scheduled" ? "مجدول" : "مسودة"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(p.createdAt)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {publishes.length > 0 && (
        <Card className="mt-6 !p-4">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span>
              آخر نشر يدوي: <strong>{publishes[0].platform}</strong> — {timeAgo(publishes[0].publishedAt)}
            </span>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}
