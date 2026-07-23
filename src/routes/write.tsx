import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label, Input, Badge } from "@/components/ui";
import { PLATFORM_META, TONE_META, useStore, type Platform, type Tone } from "@/lib/store";
import { generatePost, rewritePost, suggestHashtags, type RewriteMode } from "@/services/ai";
import { canUse, bumpUsage, remaining } from "@/lib/usage";
import {
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  Wand2,
  Hash,
  Scissors,
  Maximize2,
  Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "PostMind — كتابة منشورات بالذكاء" },
      { name: "description", content: "أنشئ منشورات مخصصة لكل منصة بنبرة الصوت المناسبة." },
      { property: "og:title", content: "كتابة منشورات — PostMind" },
      { property: "og:description", content: "توليد محتوى ذكي لكل منصات التواصل." },
    ],
  }),
  component: WritePage,
});

function WritePage() {
  const { addPost, plan } = useStore();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("professional");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState<RewriteMode | null>(null);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [provider, setProvider] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [lastError, setLastError] = useState(false);

  const runGenerate = async () => {
    if (!topic.trim()) return;
    if (!canUse("post", plan)) {
      toast.error(`وصلت الحد اليومي (${remaining("post", plan)} متبقٍ). ارقِ خطتك للاستخدام غير المحدود.`);
      return;
    }
    setLoading(true);
    setSaved(false);
    setLastError(false);
    try {
      const res = await generatePost({ topic, platform, tone, audience });
      setOutput(res.text);
      setProvider(res.provider);
      bumpUsage("post");
      if (res.provider === "local") {
        toast.warning("لم يتوفر مزوّد AI — استخدمت قالباً محلياً. أضف مفتاح Groq من الإعدادات لأفضل النتائج.");
      } else {
        toast.success(`تم التوليد عبر ${res.provider === "groq" ? "Groq" : "Together AI"}`);
      }
    } catch (e) {
      console.error(e);
      setLastError(true);
      toast.error("فشل التوليد. اضغط إعادة المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  const runRewrite = async (mode: RewriteMode) => {
    if (!output) return;
    setRewriting(mode);
    try {
      const res = await rewritePost(output, mode, tone);
      setOutput(res.text);
      setProvider(res.provider);
      const label = { rewrite: "إعادة صياغة", shorten: "اختصار", expand: "توسيع", cta: "إضافة CTA" }[mode];
      toast.success(`تم ${label}`);
    } catch {
      toast.error("فشل التعديل");
    } finally {
      setRewriting(null);
    }
  };

  const runHashtags = async () => {
    if (!topic.trim()) {
      toast.error("أدخل موضوعاً أولاً");
      return;
    }
    setHashtagsLoading(true);
    try {
      const tags = await suggestHashtags(topic, platform);
      setHashtags(tags);
      toast.success(`تم توليد ${tags.length} هاشتاغ`);
    } catch {
      toast.error("فشل توليد الهاشتاغات");
    } finally {
      setHashtagsLoading(false);
    }
  };

  const handleSave = () => {
    if (!output) return;
    addPost({ content: output, platform, tone, topic, status: "draft" });
    setSaved(true);
    toast.success("تم الحفظ كمسودة");
  };

  const copy = (text: string, msg = "تم النسخ") => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const postRemaining = remaining("post", plan);
  const disabledActions = loading || rewriting !== null;

  return (
    <AppLayout>
      <PageHeader
        title="كتابة منشور بالذكاء"
        subtitle="أدخل موضوعك، اختر التفاصيل، ودع الذكاء يكتب لك"
        action={
          postRemaining !== Infinity ? (
            <Badge tone={postRemaining > 0 ? "accent" : "warning"}>
              {postRemaining} متبقٍ اليوم
            </Badge>
          ) : (
            <Badge tone="success">غير محدود</Badge>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div>
              <Label>المنصة</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
                  const m = PLATFORM_META[p];
                  const active = p === platform;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] transition ${
                        active
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>نبرة الصوت</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TONE_META) as Tone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-xl border p-2.5 text-sm transition ${
                      t === tone
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    {TONE_META[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>الموضوع</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 300))}
                placeholder="مثال: أهمية التسويق بالمحتوى للشركات الناشئة"
              />
            </div>

            <div>
              <Label>الجمهور المستهدف (اختياري)</Label>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value.slice(0, 200))}
                placeholder="مثال: رواد الأعمال في الوطن العربي"
              />
            </div>

            <Button onClick={runGenerate} disabled={!topic.trim() || loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "جاري التوليد..." : "توليد المنشور"}
            </Button>

            <Button variant="outline" onClick={runHashtags} disabled={hashtagsLoading || !topic.trim()} className="w-full">
              {hashtagsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
              اقتراح 15 هاشتاغ
            </Button>

            {hashtags.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-elevated p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground">الهاشتاغات المقترحة</div>
                  <button
                    onClick={() => copy(hashtags.join(" "), "تم نسخ الهاشتاغات")}
                    className="text-xs text-accent hover:underline"
                  >
                    نسخ الكل
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((t) => (
                    <button
                      key={t}
                      onClick={() => copy(t, `تم نسخ ${t}`)}
                      className="rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent hover:bg-accent/20"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <span className="font-semibold">النتيجة</span>
              {provider && (
                <Badge tone={provider === "local" ? "warning" : "success"}>
                  {provider === "groq" ? "Groq" : provider === "together" ? "Together" : "قالب محلي"}
                </Badge>
              )}
            </div>
            {saved && <Badge tone="success">تم الحفظ</Badge>}
          </div>

          {output ? (
            <>
              <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={12} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copy(output)} disabled={disabledActions}>
                  <Copy className="h-4 w-4" /> نسخ
                </Button>
                <Button variant="outline" onClick={() => runRewrite("rewrite")} disabled={disabledActions}>
                  {rewriting === "rewrite" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  إعادة صياغة
                </Button>
                <Button variant="outline" onClick={() => runRewrite("shorten")} disabled={disabledActions}>
                  {rewriting === "shorten" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                  اختصار
                </Button>
                <Button variant="outline" onClick={() => runRewrite("expand")} disabled={disabledActions}>
                  {rewriting === "expand" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
                  توسيع
                </Button>
                <Button variant="outline" onClick={() => runRewrite("cta")} disabled={disabledActions}>
                  {rewriting === "cta" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  إضافة CTA
                </Button>
                <Button onClick={handleSave} disabled={disabledActions}>
                  <Save className="h-4 w-4" /> حفظ كمسودة
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 opacity-40" />
              <div>سيظهر المنشور المُولّد هنا</div>
              {lastError && (
                <Button variant="outline" onClick={runGenerate}>
                  <RefreshCw className="h-4 w-4" /> إعادة المحاولة
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-xs text-muted-foreground">
        💡 <strong className="text-foreground">تلميح:</strong> لتفعيل الذكاء الحقيقي أضف مفتاح Groq (مجاني — 8K طلب/يوم) من صفحة{" "}
        <a href="/settings" className="text-accent hover:underline">الإعدادات</a>. عند فشل Groq يتم التبديل تلقائياً إلى Together AI ثم القوالب المحلية.
      </div>
    </AppLayout>
  );
}
