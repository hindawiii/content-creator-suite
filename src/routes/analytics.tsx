import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader } from "@/components/ui";
import { useStore, PLATFORM_META, type Platform } from "@/lib/store";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Heart, MessageCircle, Share2, Eye } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "PostMind — تحليلات الأداء" },
      { name: "description", content: "تحليلات مفصلة لأداء منشوراتك على كل المنصات." },
      { property: "og:title", content: "تحليلات الأداء — PostMind" },
      { property: "og:description", content: "قِس وحسّن أداء محتواك على كل منصات التواصل." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { posts } = useStore();
  const published = posts.filter((p) => p.engagement);

  const totals = published.reduce(
    (acc, p) => {
      acc.likes += p.engagement!.likes;
      acc.comments += p.engagement!.comments;
      acc.shares += p.engagement!.shares;
      acc.views += p.engagement!.views;
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, views: 0 },
  );

  const byPlatform = Object.keys(PLATFORM_META).map((p) => {
    const items = published.filter((x) => x.platform === (p as Platform));
    const total = items.reduce((s, x) => s + x.engagement!.likes + x.engagement!.comments + x.engagement!.shares, 0);
    return { platform: PLATFORM_META[p as Platform].label, engagement: total, posts: items.length, color: PLATFORM_META[p as Platform].color };
  }).filter((x) => x.posts > 0);

  const trend = Array.from({ length: 7 }).map((_, i) => ({
    day: ["س", "ح", "ن", "ث", "ر", "خ", "ج"][i],
    likes: Math.floor(50 + Math.random() * 300),
    comments: Math.floor(10 + Math.random() * 60),
  }));

  const pieData = byPlatform.map((b) => ({ name: b.platform, value: b.engagement, color: b.color }));

  return (
    <AppLayout>
      <PageHeader title="تحليلات الأداء" subtitle="نظرة شاملة على أداء محتواك" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Heart, label: "إعجابات", value: totals.likes, color: "#e94560" },
          { icon: MessageCircle, label: "تعليقات", value: totals.comments, color: "#3b82f6" },
          { icon: Share2, label: "مشاركات", value: totals.shares, color: "#22c55e" },
          { icon: Eye, label: "مشاهدات", value: totals.views, color: "#a855f7" },
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

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-bold">التفاعل حسب المنصة</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="platform" stroke="#ffffff60" style={{ fontSize: 11 }} />
              <YAxis stroke="#ffffff60" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 12 }} />
              <Bar dataKey="engagement" radius={[8, 8, 0, 0]}>
                {byPlatform.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-4 font-bold">اتجاه التفاعل (7 أيام)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#ffffff60" style={{ fontSize: 11 }} />
              <YAxis stroke="#ffffff60" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="likes" stroke="#e94560" strokeWidth={2.5} dot={{ r: 4 }} name="إعجابات" />
              <Line type="monotone" dataKey="comments" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} name="تعليقات" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {pieData.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 font-bold">توزيع التفاعل عبر المنصات</h3>
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
      </div>
    </AppLayout>
  );
}
