import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label, Input, Badge } from "@/components/ui";
import { PLATFORM_META, type Platform } from "@/lib/store";
import {
  Copy,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import {
  getPreviewDraft,
  publishesStore,
  schedulesStore,
  type PublishRecord,
} from "@/services/storage";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "PostMind — النشر" },
      { name: "description", content: "الخطوة الأخيرة: انسخ المحتوى وافتح المنصة مباشرة، أو جدوله لاحقاً بتذكير من المتصفح." },
      { property: "og:title", content: "النشر — PostMind" },
      { property: "og:description", content: "انسخ، افتح، انشر — بدون خوادم." },
    ],
  }),
  component: PublishPage,
});

// Share-intent URLs that accept prefilled text — safer than platform home pages.
function platformShareUrl(p: Platform, text: string, imageUrl?: string): string {
  const t = encodeURIComponent(text);
  const link = encodeURIComponent(imageUrl ?? "https://postmind.app");
  switch (p) {
    case "instagram": return "https://www.instagram.com/";
    case "twitter":   return `https://twitter.com/intent/tweet?text=${t}`;
    case "facebook":  return `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${t}`;
    case "linkedin":  return `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
    case "tiktok":    return "https://www.tiktok.com/upload";
    case "youtube":   return "https://studio.youtube.com/";
    case "whatsapp":  return `https://wa.me/?text=${t}`;
    case "telegram":  return `https://t.me/share/url?url=${link}&text=${t}`;
  }
}

const NEEDS_MANUAL_PASTE: Partial<Record<Platform, boolean>> = {
  instagram: true, tiktok: true, youtube: true,
};

const TIPS = [
  "💡 انشر في وقت الذروة: 7-9 مساءً",
  "💡 أفضل يوم للنشر على لينكدإن: الثلاثاء صباحاً",
  "💡 استخدم 3-5 هاشتاقات بحد أقصى في تويتر",
  "💡 الصور المربعة (1:1) الأفضل لانستقرام",
  "💡 اسأل جمهورك سؤالاً لزيادة التفاعل",
];

function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 40 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.2 + Math.random() * 1.2;
        const rot = Math.floor(Math.random() * 360);
        const colors = ["#e94560", "#7c3aed", "#22c55e", "#f59e0b", "#38bdf8"];
        const bg = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              background: bg,
              transform: `rotate(${rot}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
            className="absolute -top-4 h-2 w-3 rounded-sm animate-[confetti-fall_1.6s_ease-in_forwards]"
          />
        );
      })}
      <style>{`@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

function PublishPage() {
  const router = useRouter();
  const draft = useMemo(() => getPreviewDraft(), []);
  const [text, setText] = useState(draft?.text ?? "");
  const [tags, setTags] = useState<string[]>(draft?.hashtags ?? []);
  const [imageUrl] = useState<string | undefined>(draft?.imageUrl);
  const contentId = useMemo(() => draft?.id ?? crypto.randomUUID(), [draft]);
  const [published, setPublished] = useState<Partial<Record<Platform, boolean>>>({});
  const [confetti, setConfetti] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedPlatform, setSchedPlatform] = useState<Platform>("instagram");
  const [schedTime, setSchedTime] = useState("");

  useEffect(() => {
    // Preload existing publish state for this content id
    const existing = publishesStore.listByContent(contentId);
    const map: Partial<Record<Platform, boolean>> = {};
    existing.forEach((r) => { map[r.platform as Platform] = true; });
    setPublished(map);
  }, [contentId]);

  const fullText = useMemo(() => {
    const t = text.trim();
    const h = tags.length ? "\n\n" + tags.join(" ") : "";
    return t + h;
  }, [text, tags]);

  const copyText = async () => {
    await navigator.clipboard.writeText(fullText);
    toast.success("نُسخ النص + الهاشتاقات");
  };

  const copyAll = async () => {
    const parts = [fullText];
    if (imageUrl) parts.push(`\n${imageUrl}`);
    await navigator.clipboard.writeText(parts.join(""));
    toast.success("نُسخ كل المحتوى");
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `postmind-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الصورة");
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const copyImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success("نُسخت الصورة");
    } catch {
      downloadImage();
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      toast.info("المشاركة السريعة غير مدعومة — استخدم زر النسخ");
      return;
    }
    try {
      await navigator.share({ text: fullText, url: imageUrl });
    } catch {
      // user cancelled
    }
  };

  const copyAndOpen = async (p: Platform) => {
    await navigator.clipboard.writeText(fullText);
    const url = platformShareUrl(p, fullText, imageUrl);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      toast.info("انسخ المنشور يدوياً وافتح التطبيق");
      return;
    }
    if (NEEDS_MANUAL_PASTE[p]) {
      toast.success(`نُسخ! افتح ${PLATFORM_META[p].label} والصق`);
    } else {
      toast.success(`تم فتح ${PLATFORM_META[p].label} مع النص جاهز`);
    }
  };

  const markPublished = (p: Platform) => {
    if (published[p]) return;
    publishesStore.add({
      contentId,
      platform: p,
      publishedAt: new Date().toISOString(),
      manual: true,
    });
    setPublished((prev) => ({ ...prev, [p]: true }));
    setConfetti(true);
    toast.success(`تم تسجيل النشر على ${PLATFORM_META[p].label}`);
    setTimeout(() => setConfetti(false), 1800);
  };

  const askNotification = async () => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const res = await Notification.requestPermission();
    return res === "granted";
  };

  const scheduleLater = async () => {
    if (!schedTime) {
      toast.error("اختر التاريخ والوقت");
      return;
    }
    await askNotification();
    schedulesStore.add({
      postId: contentId,
      platform: schedPlatform,
      scheduledTime: new Date(schedTime).toISOString(),
      status: "pending",
    });
    toast.success("تمت الجدولة! سيصلك تذكير في الوقت المحدد");
    setScheduleOpen(false);
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  if (!text && !imageUrl) {
    return (
      <AppLayout>
        <PageHeader title="النشر" subtitle="لا يوجد محتوى جاهز للنشر بعد" />
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Sparkles className="h-10 w-10 text-accent opacity-70" />
            <p className="text-sm text-muted-foreground">ولّد منشوراً أو صورة أولاً ثم عد إلى هنا للنشر.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/write"><Button>كتابة منشور</Button></Link>
              <Link to="/image"><Button variant="outline">توليد صورة</Button></Link>
            </div>
          </div>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Confetti show={confetti} />

      <PageHeader
        title="النشر"
        subtitle="انسخ، افتح المنصة، الصق — أو جدول للاحقاً"
        action={
          <button onClick={() => router.history.back()} className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="inline h-4 w-4" /> رجوع
          </button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs animate-in-up">
        <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
        <div><strong className="text-foreground">نصيحة ذكية:</strong> {tip.replace(/^💡\s*/, "")}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Preview */}
        <Card className="animate-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-semibold">معاينة المنشور</span>
          </div>

          <Label>النص</Label>
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />

          {tags.length > 0 && (
            <div className="mt-3">
              <Label>الهاشتاقات</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => removeTag(t)}
                    title="اضغط للحذف"
                    className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[11px] hover:border-destructive hover:text-destructive"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {imageUrl && (
            <div className="mt-4">
              <Label>الصورة</Label>
              <div className="overflow-hidden rounded-xl border border-border">
                <img src={imageUrl} alt="preview" className="w-full object-cover" />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadImage}><Download className="h-4 w-4" /> تنزيل الصورة</Button>
                <Button variant="outline" onClick={copyImage}><Copy className="h-4 w-4" /> نسخ الصورة</Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button onClick={copyText}><Copy className="h-4 w-4" /> نسخ النص</Button>
            <Button variant="outline" onClick={copyAll}><Copy className="h-4 w-4" /> نسخ الكل</Button>
            <Button variant="outline" onClick={nativeShare}><Share2 className="h-4 w-4" /> مشاركة</Button>
            <Button variant="outline" onClick={() => setScheduleOpen(true)}><Clock className="h-4 w-4" /> جدولة لاحقاً</Button>
          </div>
        </Card>

        {/* Platforms */}
        <Card className="animate-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-accent" />
            <span className="font-semibold">افتح المنصة وانشر</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">اضغط زر المنصة: يُنسخ المنشور تلقائياً ثم تُفتح المنصة في تبويب جديد. الصقه هناك ✨</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const m = PLATFORM_META[p];
              const done = !!published[p];
              return (
                <button
                  key={p}
                  onClick={() => copyAndOpen(p)}
                  title="انسخ المنشور، ثم الصقه في المنصة"
                  className={`group relative flex flex-col items-center gap-1 rounded-xl border p-3 text-[11px] transition ${
                    done ? "border-success/50 bg-success/5" : "border-border bg-surface-elevated hover:border-accent hover:bg-accent/5"
                  }`}
                  style={done ? undefined : { boxShadow: `inset 0 -2px 0 ${m.color}00` }}
                >
                  <span className="text-2xl transition group-hover:scale-110">{m.emoji}</span>
                  <span className="font-semibold">{m.label}</span>
                  {done && <CheckCircle2 className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-success" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <div className="text-xs font-semibold text-muted-foreground">تتبع النشر يدوياً</div>
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const m = PLATFORM_META[p];
              const done = !!published[p];
              return (
                <label key={p} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-elevated">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => markPublished(p)}
                    disabled={done}
                    className="h-4 w-4 accent-[hsl(var(--accent))]"
                  />
                  <span className="text-lg">{m.emoji}</span>
                  <span>تم النشر على {m.label}</span>
                  {done && <Badge tone="success">مسجّل</Badge>}
                </label>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-xs">
        <div><strong className="text-foreground">التالي:</strong> ولّد منشوراً لمنصة أخرى؟</div>
        <div className="flex gap-2">
          <Link to="/write"><Button variant="outline">منشور جديد</Button></Link>
          <Link to="/image"><Button variant="outline">صورة جديدة</Button></Link>
        </div>
      </div>

      {scheduleOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in-up" onClick={() => setScheduleOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">جدولة لاحقاً</h3>
            <div className="space-y-3">
              <div>
                <Label>المنصة</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSchedPlatform(p)}
                      className={`rounded-lg border p-2 text-xs transition ${schedPlatform === p ? "border-accent bg-accent/10" : "border-border bg-surface-elevated"}`}
                    >
                      <div className="text-lg">{PLATFORM_META[p].emoji}</div>
                      <div>{PLATFORM_META[p].label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>التاريخ والوقت</Label>
                <Input type="datetime-local" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
              </div>
              <p className="text-[11px] text-muted-foreground">🔔 سنطلب إذن الإشعارات لتذكيرك في الوقت المحدد. كل شيء يعمل محلياً في متصفحك.</p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setScheduleOpen(false)} className="flex-1">إلغاء</Button>
                <Button onClick={scheduleLater} className="flex-1"><Clock className="h-4 w-4" /> جدولة</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
