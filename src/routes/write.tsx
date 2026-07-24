import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Input, Label } from "@/components/ui";
import { PLATFORM_META, TONE_META, useStore, type Platform, type Tone } from "@/lib/store";
import { Sparkles, RefreshCw, Wand2, Hash, Send, Image as ImageIcon } from "lucide-react";
import { usePostGenerator, useHashtags } from "@/hooks/useAI";
import { AIOutput } from "@/components/AIOutput";
import { HashtagList } from "@/components/HashtagList";
import { RateLimitBar } from "@/components/RateLimitBar";
import { postsStore, analyticsStore, setPreviewDraft } from "@/services/storage";

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
  const { addPost } = useStore();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("professional");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState<"groq" | "together" | "fallback" | undefined>();
  const [saved, setSaved] = useState(false);

  const { generate, loading } = usePostGenerator();
  const { suggest, loading: tagLoading } = useHashtags();

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
    // Both stores (legacy compat + new poston store)
    addPost({ content: output, platform, tone, topic, status: "draft" });
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
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent" />
            <span className="font-semibold">النتيجة</span>
          </div>
          {output ? (
            <>
              <AIOutput value={output} onChange={(v) => { setOutput(v); setSaved(false); }} onSave={handleSave} source={source} saved={saved} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button onClick={handlePublish}>
                  <Send className="h-4 w-4" /> نشر الآن
                </Button>
                <Button variant="outline" onClick={handleGenImage}>
                  <ImageIcon className="h-4 w-4" /> 🎨 ولّد صورة لهذا المنشور
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
    </AppLayout>
  );
}
