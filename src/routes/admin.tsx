import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Badge } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, BarChart3, KeyRound, Lock } from "lucide-react";
import { postsStore, imagesStore, publishesStore, settingsStore } from "@/services/storage";
import { findModel } from "@/services/models";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Post On — لوحة المشرف" },
      {
        name: "description",
        content:
          "لوحة مشرف محمية بكلمة مرور: استخدام الموديلات، نسبة المفاتيح الخاصة، والتوليد اليومي.",
      },
      { property: "og:title", content: "لوحة المشرف — Post On" },
      { property: "og:description", content: "إحصاءات الاستخدام والموديلات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setChecking(false);
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setOk(data === true);
      setChecking(false);
    })();
  }, []);

  const stats = useMemo(() => {
    if (!ok) return null;
    const s = settingsStore.get();
    const posts = postsStore.list();
    const images = imagesStore.list();
    const publishes = publishesStore.list();
    const today = new Date().toISOString().slice(0, 10);
    const usage = Object.entries(s.modelUsage ?? {}).sort((a, b) => b[1] - a[1]);
    const totalCalls = usage.reduce((n, [, v]) => n + v, 0);
    return {
      users: 1, // client-side app — one local profile per device
      posts: posts.length,
      images: images.length,
      publishes: publishes.length,
      todayPosts: posts.filter((p) => p.createdAt.slice(0, 10) === today).length,
      todayImages: images.filter((i) => i.createdAt.slice(0, 10) === today).length,
      usage,
      totalCalls,
      byok: Boolean(settingsStore.getGroqKey() || settingsStore.getTogetherKey()),
      gemini: Boolean(settingsStore.getGeminiKey()),
      pollen: Boolean(settingsStore.getPollinationsKey()),
    };
  }, [ok]);

  if (!ok) {
    return (
      <AppLayout>
        <PageHeader title="لوحة المشرف" subtitle="للحسابات التي تملك صلاحية المشرف فقط" />
        <Card className="mx-auto max-w-md text-center">
          <Lock className="mx-auto mb-3 h-6 w-6 text-accent" />
          <div className="font-bold">
            {checking ? "جارٍ التحقق من الصلاحية…" : "هذه الصفحة للمشرفين فقط"}
          </div>
          {!checking && (
            <div className="mt-2 text-sm text-muted-foreground">
              سجّل الدخول بحساب يملك صلاحية المشرف.
            </div>
          )}
          {!checking && (
            <Link to="/auth">
              <Button className="mt-4 w-full">
                <ShieldCheck className="h-4 w-4" /> تسجيل الدخول
              </Button>
            </Link>
          )}
        </Card>
      </AppLayout>
    );
  }

  const s = stats!;
  const cards = [
    { label: "المستخدمون (هذا الجهاز)", value: s.users },
    { label: "إجمالي المنشورات", value: s.posts },
    { label: "إجمالي الصور", value: s.images },
    { label: "عمليات النشر", value: s.publishes },
    { label: "منشورات اليوم", value: s.todayPosts },
    { label: "صور اليوم", value: s.todayImages },
  ];

  return (
    <AppLayout>
      <PageHeader title="لوحة المشرف" subtitle="إحصاءات محلية على هذا الجهاز" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <span className="font-bold">أكثر الموديلات استخداماً</span>
        </div>
        {s.usage.length ? (
          <div className="space-y-2">
            {s.usage.map(([id, count]) => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-sm">{findModel(id)?.label ?? id}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full gradient-primary"
                    style={{ width: `${(count / s.totalCalls) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-left text-sm text-muted-foreground">{count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">لا توليد بعد.</div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" />
          <span className="font-bold">حالة المفاتيح (مجاني مقابل BYOK)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={s.byok ? "success" : "warning"}>
            {s.byok ? "مفاتيح نصية خاصة (BYOK)" : "بدون مفاتيح نصية"}
          </Badge>
          <Badge tone="success">صور: Pollinations مجاني</Badge>
          <Badge tone={s.gemini ? "success" : "default"}>
            {s.gemini ? "Gemini مضاف" : "Gemini غير مضاف"}
          </Badge>
          <Badge tone={s.pollen ? "success" : "warning"}>
            {s.pollen ? "رصيد Pollen: مفتاح مضاف" : "رصيد Pollen: 5 مجانية فقط"}
          </Badge>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          التطبيق يعمل بالكامل في المتصفح — لا يوجد خادم يجمع بيانات مستخدمين، لذا الإحصاءات محلية
          لهذا الجهاز.
        </div>
      </Card>
    </AppLayout>
  );
}
