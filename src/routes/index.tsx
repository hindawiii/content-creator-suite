import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Badge, Button } from "@/components/ui";
import { useStore, PLATFORM_META } from "@/lib/store";
import { FileText, Image as ImageIcon, CalendarClock, TrendingUp, PenSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PostMind — لوحة التحكم" },
      { name: "description", content: "مساعد محتوى بالذكاء الاصطناعي لصناع المحتوى والمسوقين." },
      { property: "og:title", content: "PostMind — مساعد المحتوى بالذكاء" },
      { property: "og:description", content: "اكتب، صمّم، وجدول محتواك عبر كل المنصات." },
    ],
  }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, tone }: { icon: typeof FileText; label: string; value: string | number; tone: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl`} style={{ background: tone }} />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${tone}22`, color: tone }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { posts, images } = useStore();
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");

  return (
    <AppLayout>
      <PageHeader
        title="أهلاً بك في PostMind 👋"
        subtitle="مساعدك الذكي لصناعة محتوى استثنائي عبر كل المنصات"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={FileText} label="إجمالي المنشورات" value={posts.length} tone="#e94560" />
        <Stat icon={ImageIcon} label="الصور المولّدة" value={images.length} tone="#a855f7" />
        <Stat icon={CalendarClock} label="مجدولة" value={scheduled.length} tone="#3b82f6" />
        <Stat icon={TrendingUp} label="منشورة" value={published.length} tone="#22c55e" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link to="/write" className="md:col-span-2">
          <Card className="group h-full cursor-pointer transition hover:border-accent">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
                <PenSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold">اكتب منشوراً بالذكاء الاصطناعي</div>
                <div className="mt-0.5 text-xs text-muted-foreground">اختر المنصة والنبرة، واحصل على منشور جاهز في ثواني</div>
              </div>
              <Sparkles className="h-5 w-5 text-accent transition group-hover:scale-110" />
            </div>
          </Card>
        </Link>
        <Link to="/image">
          <Card className="h-full cursor-pointer transition hover:border-accent">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-2/20 text-accent-2">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold">صمّم صورة</div>
                <div className="text-xs text-muted-foreground">توليد بصور بأبعاد مختلفة</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر المنشورات</h2>
          <Link to="/schedule"><Button variant="ghost">عرض الكل ←</Button></Link>
        </div>
        <div className="space-y-3">
          {posts.slice(0, 5).map((p) => {
            const meta = PLATFORM_META[p.platform];
            return (
              <Card key={p.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: `${meta.color}22` }}>
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <Badge tone={p.status === "published" ? "success" : p.status === "scheduled" ? "accent" : "default"}>
                        {p.status === "published" ? "منشور" : p.status === "scheduled" ? "مجدول" : "مسودة"}
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
    </AppLayout>
  );
}
