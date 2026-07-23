import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Badge, Label } from "@/components/ui";
import { useStore, PLATFORM_META, type Platform } from "@/lib/store";
import { Check, Link2, User, KeyRound, Download, Trash2, Zap } from "lucide-react";
import { APIKeyInput } from "@/components/APIKeyInput";
import { settingsStore, exportAllStorage, resetAllStorage } from "@/services/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Post On — الإعدادات والاشتراك" },
      { name: "description", content: "إدارة مفاتيح Groq وTogether AI، الحصص، والاشتراك — كلها محلياً في المتصفح." },
      { property: "og:title", content: "الإعدادات — Post On" },
      { property: "og:description", content: "خطط اشتراك مرنة وإدارة كاملة للمفاتيح والبيانات." },
    ],
  }),
  component: SettingsPage,
});

const PLANS = [
  { key: "free" as const, name: "المجانية", price: "0$", period: "دائم", features: ["10 منشورات / يوم", "5 صور / يوم", "منصة واحدة", "تحليلات أساسية"] },
  { key: "pro" as const, name: "برو", price: "9$", period: "شهرياً", features: ["منشورات غير محدودة", "صور غير محدودة", "كل المنصات", "تحليلات متقدمة"], popular: true },
];

function SettingsPage() {
  const { connectedAccounts, toggleAccount } = useStore();
  const [groqKey, setGroqKey] = useState("");
  const [togetherKey, setTogetherKey] = useState("");
  const [useOwnKeys, setUseOwnKeys] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  useEffect(() => {
    const s = settingsStore.get();
    setGroqKey(settingsStore.getGroqKey());
    setTogetherKey(settingsStore.getTogetherKey());
    setUseOwnKeys(s.useOwnKeys);
    setPlan(s.plan);
  }, []);

  const saveKeys = () => {
    settingsStore.setGroqKey(groqKey.trim());
    settingsStore.setTogetherKey(togetherKey.trim());
    settingsStore.set({ useOwnKeys });
    toast.success("تم حفظ المفاتيح محلياً (مُشوّشة)");
  };

  const changePlan = (p: "free" | "pro") => {
    setPlan(p);
    settingsStore.set({ plan: p });
    toast.success(p === "pro" ? "تمت الترقية إلى Pro (تجريبي)" : "تم التبديل إلى الخطة المجانية");
  };

  const handleExport = () => {
    const blob = new Blob([exportAllStorage()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poston-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات");
  };

  const handleReset = () => {
    if (!confirm("سيتم مسح كل البيانات المحلية. متأكد؟")) return;
    resetAllStorage();
    toast.success("تم مسح كل البيانات");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <AppLayout>
      <PageHeader title="الإعدادات" subtitle="مفاتيح API، الاشتراك، وإدارة البيانات — كلها في متصفحك" />

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold">مستخدم Post On</div>
            <div className="text-xs text-muted-foreground">وضع العميل الكامل — بدون خادم</div>
          </div>
          <Badge tone="accent">{plan === "pro" ? "Pro" : "Free"}</Badge>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-bold">مفاتيح API</h2>
        </div>

        <label className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 text-sm">
          <input
            type="checkbox"
            checked={useOwnKeys}
            onChange={(e) => setUseOwnKeys(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--accent))]"
          />
          <div className="flex-1">
            <div className="font-semibold">استخدم مفاتيحي الخاصة</div>
            <div className="text-xs text-muted-foreground">
              {useOwnKeys ? "الطلبات تذهب من متصفحك مباشرة بمفاتيحك." : "وضع تجريبي — سيُستخدم القالب المحلي فقط."}
            </div>
          </div>
        </label>

        <div className="space-y-4">
          <APIKeyInput
            label="Groq API Key"
            value={groqKey}
            onChange={setGroqKey}
            placeholder="gsk_..."
            hint="يُخزَّن مُشوَّشاً في localStorage. احصل عليه من console.groq.com"
          />
          <APIKeyInput
            label="Together AI Key (احتياطي — اختياري)"
            value={togetherKey}
            onChange={setTogetherKey}
            placeholder="..."
            hint="يُستخدم تلقائياً عند فشل Groq. api.together.xyz/settings/api-keys"
          />
          <Button onClick={saveKeys} className="w-full">
            <Check className="h-4 w-4" /> حفظ المفاتيح
          </Button>
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
                    <div className="text-xs text-muted-foreground">{connected ? "متصل (محاكاة)" : "غير متصل"}</div>
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

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">خطط الاشتراك (محاكاة)</h2>
        <div className="grid gap-3 md:grid-cols-2">
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
                  onClick={() => changePlan(pl.key)}
                  disabled={active}
                >
                  {active ? "خطتك الحالية" : <><Zap className="h-4 w-4" /> اختيار الخطة</>}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <Label>إدارة البيانات المحلية</Label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> تصدير البيانات (JSON)
          </Button>
          <Button variant="outline" onClick={handleReset} className="!text-destructive">
            <Trash2 className="h-4 w-4" /> مسح كل البيانات
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
