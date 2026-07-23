import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Select, Label, Input, Badge } from "@/components/ui";
import { PLATFORM_META, TONE_META, useStore, type Platform, type Tone } from "@/lib/store";
import { Sparkles, Copy, Save, RefreshCw, Wand2 } from "lucide-react";

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

const TEMPLATES: Record<Tone, string[]> = {
  professional: [
    "في عالم يتطور كل يوم، {topic} لم يعد رفاهية بل ضرورة.\n\nإليك 3 نقاط يجب أن تعرفها:\n\n1️⃣ الاستراتيجية أهم من الأدوات\n2️⃣ البيانات تُحدث الفرق\n3️⃣ الاستمرارية هي المفتاح\n\nما رأيك؟ شاركنا في التعليقات 👇",
  ],
  friendly: [
    "يا جماعة! 👋\n\nتعالوا نتكلم عن {topic} بصراحة…\n\nصدقوني، لو طبقتوا هذي الفكرة الصغيرة، راح تتغير أمور كثيرة عندكم ✨\n\nمين جرّب قبل؟ خبرونا 💬",
  ],
  humorous: [
    "أنا: راح أتعلم {topic} اليوم! 💪\nأنا بعد 5 دقائق: ليش الحياة صعبة؟ 😅\n\nبس جدياً، خذوها مني — الأمر أسهل مما تتوقعون 🎯",
  ],
  motivational: [
    "لا تنتظر اللحظة المثالية.\n\n{topic} يبدأ بخطوة واحدة صغيرة اليوم — وليس غداً.\n\n🔥 كل خبير كان مبتدئاً.\n🔥 كل قصة نجاح بدأت بقرار.\n🔥 كل شيء ممكن مع الاستمرارية.\n\nابدأ الآن. ✨",
  ],
};

const HASHTAGS = ["#تسويق_رقمي", "#صناعة_محتوى", "#ريادة_أعمال", "#سوشيال_ميديا", "#نمو", "#إبداع", "#محتوى_عربي", "#PostMind"];

function generate(topic: string, tone: Tone, platform: Platform): string {
  const tpl = TEMPLATES[tone][0].replace(/\{topic\}/g, topic || "الموضوع");
  const tags = HASHTAGS.slice(0, platform === "twitter" ? 3 : 6).join(" ");
  return `${tpl}\n\n${tags}`;
}

function WritePage() {
  const { addPost } = useStore();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("professional");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSaved(false);
    setTimeout(() => {
      setOutput(generate(topic, tone, platform));
      setLoading(false);
    }, 700);
  };

  const handleSave = () => {
    if (!output) return;
    addPost({ content: output, platform, tone, topic, status: "draft" });
    setSaved(true);
  };

  return (
    <AppLayout>
      <PageHeader title="كتابة منشور بالذكاء" subtitle="أدخل موضوعك، اختر التفاصيل، ودع الذكاء يكتب لك" />

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

            <Button onClick={handleGenerate} disabled={!topic.trim() || loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "جاري التوليد..." : "توليد المنشور"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <span className="font-semibold">النتيجة</span>
            </div>
            {saved && <Badge tone="success">تم الحفظ</Badge>}
          </div>
          {output ? (
            <>
              <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={12} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(output)}>
                  <Copy className="h-4 w-4" /> نسخ
                </Button>
                <Button variant="outline" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4" /> إعادة صياغة
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4" /> حفظ كمسودة
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 opacity-40" />
              <div>سيظهر المنشور المُولّد هنا</div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-xs text-muted-foreground">
        💡 <strong className="text-foreground">ملاحظة:</strong> يستخدم هذا الإصدار قوالب محلية. لتفعيل الذكاء الاصطناعي الحقيقي (Groq / Lovable AI)، أخبرني بذلك في الرسالة التالية.
      </div>
    </AppLayout>
  );
}
