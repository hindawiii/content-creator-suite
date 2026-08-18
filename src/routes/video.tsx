import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label, Badge, Select } from "@/components/ui";
import { Video, Sparkles, RefreshCw, Download, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { pollinationsVideo } from "@/services/pollinations";
import { puterVideo } from "@/services/puter";
import { settingsStore } from "@/services/storage";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Post On — توليد فيديو بالذكاء" },
      { name: "description", content: "توليد فيديو قصير من نص أو من صورة عبر Pollinations Video أو مفتاحك الخاص." },
      { property: "og:title", content: "توليد فيديو — Post On" },
      { property: "og:description", content: "نص إلى فيديو وصورة إلى فيديو مع تنبيه واضح لتكاليف الرصيد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideoPage,
});

const ASPECTS = ["16:9", "9:16", "1:1"] as const;

function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("16:9");
  const [engine, setEngine] = useState<"pollinations" | "puter">("pollinations");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHasKey(Boolean(settingsStore.getPollinationsKey()));
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const startProgress = () => {
    setProgress(4);
    timer.current = setInterval(() => {
      // Simulated progress — the endpoint returns the finished file in one response.
      setProgress((p) => (p >= 92 ? 92 : p + 2));
    }, 900);
  };
  const stopProgress = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    startProgress();
    const toastId = toast.loading("جاري توليد الفيديو — قد يستغرق دقائق...");
    try {
      const url =
        engine === "puter"
          ? await puterVideo(prompt.trim())
          : await pollinationsVideo({
              prompt: prompt.trim(),
              token: settingsStore.getPollinationsKey() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              aspect,
            });
      setProgress(100);
      setVideoUrl(url);
      toast.success("تم توليد الفيديو", { id: toastId });
    } catch (err) {
      const msg = String(err);
      if (msg.includes("needs_credits")) {
        toast.error("يحتاج رصيد Pollen أو مفتاحاً خاصاً — راجع الإعدادات", { id: toastId });
      } else if (msg.includes("puter")) {
        toast.error("Puter غير متاح حالياً — سجّل دخولك في Puter وحاول مجدداً", { id: toastId });
      } else {
        toast.error("تعذر توليد الفيديو — حاول لاحقاً", { id: toastId });
      }
      setProgress(0);
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="توليد فيديو"
        subtitle="نص إلى فيديو وصورة إلى فيديو — مجاني محدود، أو بمفتاحك الخاص"
        action={
          <Link to="/image">
            <Button variant="outline">
              <ImageIcon className="h-4 w-4" /> صور
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="text-sm">
          <div className="font-semibold text-warning">⚠️ توليد الفيديو ليس مجانياً بالكامل</div>
          <div className="mt-0.5 text-muted-foreground">
            يحتاج رصيد Pollen أو مفتاحك الخاص. تحصل على 5 نقاط Pollen مجانية عند التسجيل. بديل: Google Veo بمفتاح Google AI Studio (يتطلب تفعيل الفواتير) أو Puter.js حيث تدفع من حسابك.
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={hasKey ? "success" : "warning"}>{hasKey ? "مفتاح Pollinations مضاف" : "يحتاج رصيد"}</Badge>
            <Link to="/settings" className="text-xs text-accent underline">إضافة المفاتيح</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div>
              <Label>وصف الفيديو</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="مثال: كاميرا تتحرك ببطء فوق كثبان رملية عند الغروب"
              />
            </div>
            <div>
              <Label>رابط صورة البداية (اختياري — يحوّلها إلى فيديو)</Label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <Label>المحرّك</Label>
              <Select value={engine} onChange={(e) => setEngine(e.target.value as typeof engine)}>
                <option value="pollinations">Pollinations Video (Alpha) — يحتاج رصيد</option>
                <option value="puter">Puter.js — تدفع من حسابك</option>
              </Select>
            </div>
            <div>
              <Label>الأبعاد</Label>
              <div className="flex gap-2">
                {ASPECTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`flex-1 rounded-xl border p-2.5 text-sm transition ${
                      aspect === a ? "border-accent bg-accent/10" : "border-border bg-surface-elevated"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={!prompt.trim() || loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "جاري التوليد..." : "توليد الفيديو"}
            </Button>
            {loading && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-1 text-center text-xs text-muted-foreground">{progress}%</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-accent" />
            <span className="font-semibold">النتيجة</span>
          </div>
          {videoUrl ? (
            <div className="space-y-3">
              <video src={videoUrl} controls className="w-full rounded-xl border border-border" />
              <a href={videoUrl} download={`poston-${Date.now()}.mp4`}>
                <Button className="w-full">
                  <Download className="h-4 w-4" /> تنزيل الفيديو
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <Video className="h-8 w-8 opacity-40" />
              <div>سيظهر الفيديو المولّد هنا</div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
