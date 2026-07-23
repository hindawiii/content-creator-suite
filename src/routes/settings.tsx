import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Badge, Input, Label } from "@/components/ui";
import { useStore, PLATFORM_META, type Platform } from "@/lib/store";
import { getApiKeys, setApiKeys } from "@/services/ai";
import { Check, Link2, User, Key, Eye, EyeOff } from "lucide-react";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "PostMind — الإعدادات والاشتراك" },
      { name: "description", content: "إدارة الحساب، ربط المنصات، والاشتراك." },
      { property: "og:title", content: "الإعدادات — PostMind" },
      { property: "og:description", content: "خطط اشتراك مرنة وإدارة كاملة للحساب." },
    ],
  }),
  component: SettingsPage,
});

const PLANS = [
  {
    key: "free" as const,
    name: "المجانية",
    price: "0$",
    period: "دائم",
    features: ["10 منشورات / شهر", "5 صور / شهر", "منصة واحدة", "تحليلات أساسية"],
  },
  {
    key: "pro" as const,
    name: "برو",
    price: "9$",
    period: "شهرياً",
    features: ["منشورات غير محدودة", "50 صورة / شهر", "كل المنصات", "تحليلات متقدمة", "جدولة ذكية"],
    popular: true,
  },
  {
    key: "business" as const,
    name: "بيزنس",
    price: "29$",
    period: "شهرياً",
    features: ["كل مميزات برو", "صور غير محدودة", "فريق 5 أعضاء", "وصول API", "دعم أولوي"],
  },
];

function SettingsPage() {
  const { connectedAccounts, toggleAccount, plan, setPlan } = useStore();
  const [groq, setGroq] = useState("");
  const [together, setTogether] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showTogether, setShowTogether] = useState(false);

  useEffect(() => {
    const k = getApiKeys();
    setGroq(k.groq ?? "");
    setTogether(k.together ?? "");
  }, []);

  const saveKeys = () => {
    setApiKeys({ groq: groq.trim() || undefined, together: together.trim() || undefined });
    toast.success("تم حفظ المفاتيح");
  };



  return (
    <AppLayout>
      <PageHeader title="الإعدادات" subtitle="إدارة حسابك، المنصات المتصلة، والاشتراك" />

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold">مستخدم PostMind</div>
            <div className="text-xs text-muted-foreground">user@postmind.app</div>
          </div>
          <Badge tone="accent">{PLANS.find((p) => p.key === plan)?.name}</Badge>
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">حسابات التواصل الاجتماعي</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
            const m = PLATFORM_META[p];
            const connected = connectedAccounts[p];
            return (
              <Card key={p} className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg" style={{ background: `${m.color}22` }}>
                    {m.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{connected ? "متصل" : "غير متصل"}</div>
                  </div>
                  <Button variant={connected ? "outline" : "primary"} onClick={() => toggleAccount(p)}>
                    {connected ? <><Check className="h-4 w-4" /> متصل</> : <><Link2 className="h-4 w-4" /> ربط</>}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">خطط الاشتراك</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((pl) => {
            const active = plan === pl.key;
            return (
              <Card key={pl.key} className={`relative ${pl.popular ? "border-accent" : ""}`}>
                {pl.popular && (
                  <div className="absolute -top-3 right-4 rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                    الأكثر شعبية
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{pl.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{pl.price}</span>
                  <span className="text-xs text-muted-foreground">/ {pl.period}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {pl.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={active ? "outline" : pl.popular ? "primary" : "outline"}
                  className="mt-5 w-full"
                  onClick={() => setPlan(pl.key)}
                  disabled={active}
                >
                  {active ? "خطتك الحالية" : "اختيار الخطة"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
