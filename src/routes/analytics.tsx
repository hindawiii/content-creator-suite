import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader } from "@/components/ui";
import { PLATFORM_META, type Platform } from "@/lib/store";
import {
  postsStore,
  imagesStore,
  publishesStore,
  schedulesStore,
  type PostRecord,
  type ImageRecord,
  type PublishRecord,
  type ScheduleRecord,
} from "@/services/storage";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Image as ImageIcon, Send, Clock } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Post On — تحليلات الأداء" },
      { name: "description", content: "تحليلات مبنية على نشاطك الفعلي: المنشورات، الصور، وعمليات النشر عبر المنصات." },
      { property: "og:title", content: "تحليلات الأداء — Post On" },
      { property: "og:description", content: "قِس نشاطك الحقيقي داخل التطبيق عبر كل منصات التواصل." },
    ],
  }),
  component: AnalyticsPage,
});

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

function platformLabel(p: string): string {
  return PLATFORM_META[p as Platform]?.label ?? p;
}

function platformColor(p: string): string {
  return PLATFORM_META[p as Platform]?.color ?? "#a855f7";
}

function AnalyticsPage() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [publishes, setPublishes] = useState<PublishRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);

  useEffect(() => {
    setPosts(postsStore.list());
    setImages(imagesStore.list());
    setPublishes(publishesStore.list());
    setSchedules(schedulesStore.list());
  }, []);

  const pendingSchedules = schedules.filter((s) => s.status === "pending");
  const isEmpty = posts.length === 0 && images.length === 0 && publishes.length === 0;

  const byPlatform = useMemo(() => {
    const map = new Map<string, number>();
    publishes.forEach((r) => map.set(r.platform, (map.get(r.platform) ?? 0) + 1));
    return [...map.entries()]
      .map(([platform, count]) => ({ platform: platformLabel(platform), count, color: platformColor(platform) }))
      .sort((a, b) => b.count - a.count);
  }, [publishes]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toLocaleDateString("en-CA"), day: DAY_LABELS[d.getDay()], posts: 0, publishes: 0, images: 0 };
    });
    const idx = new Map(days.map((d) => [d.key, d]));
    posts.forEach((p) => { const d = idx.get(dayKey(p.createdAt)); if (d) d.posts += 1; });
    images.forEach((i) => { const d = idx.get(dayKey(i.createdAt)); if (d) d.images += 1; });
    publishes.forEach((r) => { const d = idx.get(dayKey(r.publishedAt)); if (d) d.publishes += 1; });
    return days;
  }, [posts, images, publishes]);

  const topHashtags = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => (p.hashtags ?? []).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [posts]);

  const aiShare = posts.length ? Math.round((posts.filter((p) => p.aiGenerated).length / posts.length) * 100) : 0;
  const pieData = byPlatform.map((b) => ({ name: b.platform, value: b.count, color: b.color }));

  return (
    <AppLayout>
      <PageHeader title="تحليلات الأداء" subtitle="أرقام حقيقية مبنية على نشاطك داخل التطبيق" />

      {isEmpty ? (
        <Card className="text-center">
          <div className="text-4xl">📊</div>
          <h3 className="mt-3 font-bold">لا توجد بيانات بعد</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            ابدأ بتوليد منشور أو صورة، وسجّل عمليات النشر لتظهر إحصائياتك هنا.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/write" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              اكتب منشوراً
            </Link>
            <Link to="/image" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
              ولّد صورة
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: FileText, label: "منشورات محفوظة", value: posts.length, color: "#3b82f6" },
              { icon: ImageIcon, label: "صور مولّدة", value: images.length, color: "#a855f7" },
              { icon: Send, label: "عمليات نشر", value: publishes.length, color: "#22c55e" },
              { icon: Clock, label: "بانتظار الجدولة", value: pendingSchedules.length, color: "#e94560" },
            ].map((s) => (
              <Card key={s.label}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.color}22`, color: s.color }}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-xl font-bold">{s.value.toLocaleString("ar")}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4">
            <Card>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">نسبة المحتوى المُولّد بالذكاء</span>
                <span className="font-bold text-primary">{aiShare}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-l from-primary to-accent" style={{ width: `${aiShare}%` }} />
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-bold">عمليات النشر حسب المنصة</h3>
              {byPlatform.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">لم تسجّل أي عملية نشر بعد — سجّلها من شاشة النشر.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byPlatform}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="platform" stroke="#ffffff60" style={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} stroke="#ffffff60" style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 12 }} />
                    <Bar dataKey="count" name="نشر" radius={[8, 8, 0, 0]}>
                      {byPlatform.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-bold">نشاطك (آخر 7 أيام)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#ffffff60" style={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} stroke="#ffffff60" style={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="منشورات" />
                  <Line type="monotone" dataKey="images" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} name="صور" />
                  <Line type="monotone" dataKey="publishes" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} name="نشر" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {pieData.length > 0 && (
              <Card>
                <h3 className="mb-4 font-bold">توزيع النشر عبر المنصات</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {topHashtags.length > 0 && (
              <Card>
                <h3 className="mb-4 font-bold">أكثر الهاشتاقات استخداماً</h3>
                <div className="flex flex-wrap gap-2">
                  {topHashtags.map(([tag, count]) => (
                    <span key={tag} className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs">
                      {tag} <span className="text-muted-foreground">×{count}</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            ملاحظة: الأرقام تعكس نشاطك داخل Post On فقط. أرقام الإعجابات والمشاهدات الحقيقية تحتاج ربطاً رسمياً بحسابات المنصات.
          </p>
        </>
      )}
    </AppLayout>
  );
}
