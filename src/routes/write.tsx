import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Input, Label } from "@/components/ui";
import { PLATFORM_META, TONE_META, DIALECT_META, type Platform, type Tone, type Dialect } from "@/lib/store";
import { Sparkles, RefreshCw, Wand2, Hash, Send, Image as ImageIcon, Lightbulb, RotateCcw, Scissors, Maximize2 } from "lucide-react";
import { usePostGenerator, useHashtags } from "@/hooks/useAI";
import { useSmartResize } from "@/hooks/useSmartResize";
import { AIOutput } from "@/components/AIOutput";
import { HashtagList } from "@/components/HashtagList";
import { RateLimitBar } from "@/components/RateLimitBar";
import { SmartResizeModal } from "@/components/SmartResizeModal";
import { Badge } from "@/components/ui";
import { postsStore, analyticsStore, setPreviewDraft } from "@/services/storage";
import { PLATFORM_LIMITS, SWEET_SPOTS, sweetStatus } from "@/utils/platformLimits";

const TIPS = [
  "افتح بسؤال أو رقم صادم — أول سطر يقرر إذا يكمل القارئ أم لا.",
  "استخدم إيموجي واحد كل 2-3 أسطر — لا تُفرط.",
  "الجُمل القصيرة أقوى من الفقرات الطويلة على السوشيال.",
  "أضف CTA واضح في النهاية: علّق، شارك، احفظ.",
  "تويتر يحب الأرقام والقوائم. إنستقرام يحب القصص.",
  "لينكدإن: ابدأ بقيمة عملية في أول 3 أسطر قبل 'المزيد'.",
];

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "Post On — كتابة منشورات بالذكاء" },
      { name: "description", content: "أنشئ منشورات مخصصة لكل منصة بنبرة الصوت المناسبة عبر Groq وTogether AI مباشرة من المتصفح." },
      { property: "og:title", content: "كتابة منشورات — Post On" },
      { property: "og:description", content: "توليد محتوى ذكي لكل منصات التواصل." },
    ],
  }),
  component: WritePage,
});

function WritePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("professional");
  const [dialect, setDialect] = useState<Dialect>("msa");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");

  // remember last dialect choice (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("poston_dialect") as Dialect | null;
      if (saved && saved in DIALECT_META) setDialect(saved);
    } catch { /* ignore */ }
  }, []);
  const pickDialect = (d: Dialect) => {
    setDialect(d);
    try { localStorage.setItem("poston_dialect", d); } catch { /* ignore */ }
  };

  const [output, setOutput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState<"groq" | "together" | "fallback" | undefined>();
  const [saved, setSaved] = useState(false);
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);
  const limit = PLATFORM_LIMITS[platform];
  const chars = output.length + (tags.length ? tags.join(" ").length + 2 : 0);
  const overLimit = chars > limit;

  const { generate, loading } = usePostGenerator();
  const { suggest, loading: tagLoading } = useHashtags();
  const { shorten, expand, loading: resizeLoading } = useSmartResize();
  const [resizeOpen, setResizeOpen] = useState(false);
  const [resizeMode, setResizeMode] = useState<"shorten" | "expand">("shorten");
  const [resizeResult, setResizeResult] = useState<string | null>(null);

  const openResize = async (mode: "shorten" | "expand") => {
    if (!output.trim()) return;
    setResizeMode(mode);
    setResizeResult(null);
    setResizeOpen(true);
    const res = mode === "shorten" ? await shorten(output, platform) : await expand(output, platform);
    setResizeResult(res);
  };
  const retryResize = async () => {
    setResizeResult(null);
    const res = resizeMode === "shorten" ? await shorten(output, platform) : await expand(output, platform);
    setResizeResult(res);
  };
  const applyResize = (v: string) => {
    setOutput(v);
    setSaved(false);
    setResizeOpen(false);
  };

  const status = output ? sweetStatus(output, platform) : null;
  const spot = SWEET_SPOTS[platform];
  const tooShortForExpand = !!spot && output.length > 0 && output.length < spot[0];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setSaved(false);
    const res = await generate({ topic, platform, tone, audience });
    setOutput(res.content);
    setTags(res.hashtags);
    setSource(res.source);
  };

  const handleSuggest = async () => {
    if (!topic.trim()) return;
    const tt = await suggest(topic);
    setTags(tt);
  };

  const handleSave = () => {
    if (!output) return;
    postsStore.add({ content: output, platform, tone, aiGenerated: source !== "fallback", hashtags: tags });
    analyticsStore.bumpPost(platform);
    setSaved(true);
  };


  const handlePublish = () => {
    if (!output) return;
    setPreviewDraft({ text: output, hashtags: tags });
    navigate({ to: "/publish" });
  };

  const handleGenImage = () => {
    const seed = topic || output.slice(0, 120);
    setPreviewDraft({ text: output, hashtags: tags });
    try { sessionStorage.setItem("poston_image_prompt", seed); } catch { /* ignore */ }
    navigate({ to: "/image" });
  };


  return (
    <AppLayout>
      <PageHeader title="كتابة منشور بالذكاء" subtitle="Groq → Together AI → قالب محلي — كلها من متصفحك مباشرة" />

      <div className="mb-4"><RateLimitBar kind="post" /></div>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs">
        <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
        <div><strong className="text-foreground">هل تعلم؟</strong> {tip}</div>
      </div>

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
                        active ? "border-accent bg-accent/10 text-foreground" : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
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
                      t === tone ? "border-accent bg-accent/10" : "border-border bg-surface-elevated text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    {TONE_META[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>الموضوع</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: أهمية التسويق بالمحتوى للشركات الناشئة" />
            </div>

            <div>
              <Label>الجمهور المستهدف (اختياري)</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="مثال: رواد الأعمال في الوطن العربي" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={!topic.trim() || loading} className="flex-1">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "جاري التوليد..." : "توليد المنشور"}
              </Button>
              <Button variant="outline" onClick={handleSuggest} disabled={!topic.trim() || tagLoading}>
                <Hash className={`h-4 w-4 ${tagLoading ? "animate-spin" : ""}`} /> هاشتاقات
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <span className="font-semibold">النتيجة</span>
            </div>
            {output && (
              <div className="flex items-center gap-2 text-[11px]">
                {status === "ideal" && <Badge tone="success">مثالي ✅</Badge>}
                {status === "short" && <Badge tone="warning">قصير</Badge>}
                {status === "long" && <Badge tone="warning">طويل</Badge>}
                <span className={overLimit ? "text-destructive font-semibold" : "text-muted-foreground"}>
                  {PLATFORM_META[platform].emoji} {chars}/{limit.toLocaleString()} {overLimit ? "✗" : "✓"}
                </span>
              </div>
            )}
          </div>
          {output ? (
            <>
              <AIOutput value={output} onChange={(v) => { setOutput(v); setSaved(false); }} onSave={handleSave} source={source} saved={saved} />

              {(overLimit || tooShortForExpand) && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-accent/30 bg-accent/5 p-2.5">
                  {overLimit && (
                    <Button variant="outline" onClick={() => openResize("shorten")} disabled={resizeLoading}>
                      <Scissors className="h-4 w-4" /> 🪄 اختصر ذكياً
                    </Button>
                  )}
                  {tooShortForExpand && (
                    <Button variant="outline" onClick={() => openResize("expand")} disabled={resizeLoading}>
                      <Maximize2 className="h-4 w-4" /> 📖 أطول
                    </Button>
                  )}
                  <span className="self-center text-[11px] text-muted-foreground">
                    {overLimit ? `النص يتجاوز حد ${PLATFORM_META[platform].label}` : `أضف تفاصيل — النص أقصر من المثالي`}
                  </span>
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Button onClick={handlePublish}>
                  <Send className="h-4 w-4" /> نشر الآن
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                  <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> توليد مرة أخرى
                </Button>
                <Button variant="outline" onClick={handleGenImage}>
                  <ImageIcon className="h-4 w-4" /> صورة للمنشور
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 opacity-40" />
              <div>سيظهر المنشور المُولّد هنا</div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-4">
              <HashtagList tags={tags} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-xs text-muted-foreground">
        💡 <strong className="text-foreground">وضع العميل الكامل:</strong> كل الطلبات تذهب مباشرة من متصفحك إلى Groq / Together AI / Pollinations. لا توجد خوادم وسيطة. أضف مفاتيحك من صفحة <strong>الإعدادات</strong>.
      </div>

      <SmartResizeModal
        open={resizeOpen}
        mode={resizeMode}
        platform={platform}
        original={output}
        result={resizeResult}
        loading={resizeLoading}
        onRetry={retryResize}
        onApply={applyResize}
        onClose={() => setResizeOpen(false)}
      />
    </AppLayout>
  );
}
