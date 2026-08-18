import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label, Badge, Select } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Image as ImageIcon, Sparkles, RefreshCw, Trash2, Send, Download, Link as LinkIcon, Wand2, Upload, Video } from "lucide-react";
import { useImageGenerator } from "@/hooks/useAI";
import { ImageGrid, type GridImage } from "@/components/ImageGrid";
import { RateLimitBar } from "@/components/RateLimitBar";
import { imagesStore, analyticsStore, setPreviewDraft, getPreviewDraft, settingsStore } from "@/services/storage";
import { STYLE_PRESETS, buildStyleTransferPrompt } from "@/services/pollinations";

const ASPECTS = [
  { key: "1:1", label: "مربع", w: 1024, h: 1024 },
  { key: "9:16", label: "عمودي (ستوري)", w: 720, h: 1280 },
  { key: "16:9", label: "أفقي", w: 1280, h: 720 },
  { key: "4:5", label: "منشور", w: 1024, h: 1280 },
] as const;
type AspectKey = (typeof ASPECTS)[number]["key"];

const PROVIDERS = [
  { key: "pollinations", label: "Pollinations Flux — مجاني بلا مفتاح", badge: "مجاني" },
  { key: "gemini", label: "Gemini 2.5 Flash Image — بمفتاحك", badge: "مفتاحك" },
  { key: "puter", label: "Puter.js — تدفع من حسابك", badge: "مفتاحك" },
] as const;

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "Post On — تصميم صور بالذكاء" },
      { name: "description", content: "توليد صور احترافية وأنمي ونقل ستايل مجاناً عبر Pollinations Flux مباشرة من المتصفح." },
      { property: "og:title", content: "تصميم صور — Post On" },
      { property: "og:description", content: "وضع أنمي، ستايلات جاهزة، ونقل ستايل من صورة مرجعية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImagePage,
});

function ImagePage() {
  const { images, addImage, removeImage } = useStore();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<AspectKey>("1:1");
  const [batch, setBatch] = useState<GridImage[]>([]);
  const [anime, setAnime] = useState(false);
  const [style, setStyle] = useState<string>("");
  const [provider, setProvider] = useState<"pollinations" | "gemini" | "puter">("pollinations");
  const [refUrl, setRefUrl] = useState("");
  const [refDesc, setRefDesc] = useState("");
  const { generate, loading } = useImageGenerator();

  useEffect(() => {
    const s = settingsStore.get();
    setAnime(s.animeMode);
    setProvider(s.imageProvider ?? "pollinations");
    try {
      const seed = sessionStorage.getItem("poston_image_prompt");
      if (seed) {
        setPrompt(seed);
        sessionStorage.removeItem("poston_image_prompt");
      }
    } catch { /* ignore */ }
  }, []);

  const toggleAnime = () => {
    const next = !anime;
    setAnime(next);
    settingsStore.set({ animeMode: next });
  };

  const changeProvider = (p: "pollinations" | "gemini" | "puter") => {
    setProvider(p);
    settingsStore.set({ imageProvider: p });
    if (p === "gemini" && !settingsStore.getGeminiKey()) {
      toast.message("أضف مفتاح Google AI Studio من الإعدادات لتفعيل Gemini");
    }
  };

  const dims = ASPECTS.find((a) => a.key === aspect)!;
  const styleModifier = STYLE_PRESETS.find((s) => s.key === style)?.modifier;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    // Style transfer: a public reference URL uses img2img; an uploaded/described
    // reference falls back to prompt engineering.
    const basePrompt = !refUrl && refDesc.trim() ? buildStyleTransferPrompt(prompt, refDesc.trim()) : prompt;
    const results = await generate(basePrompt, {
      width: dims.w,
      height: dims.h,
      anime,
      styleModifier,
      referenceUrl: refUrl.trim() || undefined,
      provider,
    });
    setBatch(results);
    results.forEach((r) => {
      addImage({ prompt, aspectRatio: aspect, url: r.url });
      imagesStore.add({ prompt, url: r.url });
      analyticsStore.bumpImage();
    });
  };

  const onRefFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر ملف صورة");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Local uploads have no public URL → we describe them in the prompt instead.
      setRefDesc((d) => d || "the uploaded reference image");
      toast.message("تم رفع المرجع — سيُستخدم وصفه في المطالبة. الصق رابطاً عاماً لنقل ستايل مباشر.");
    };
    reader.readAsDataURL(file);
  };

  const downloadImg = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `poston-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(u);
      toast.success("تم التنزيل");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("نُسخ رابط الصورة");
  };

  const useInPost = (url: string) => {
    const existing = getPreviewDraft();
    setPreviewDraft({
      text: existing?.text ?? "",
      hashtags: existing?.hashtags ?? [],
      imageUrl: url,
    });
    toast.success("تمت إضافة الصورة للمسودة");
    navigate({ to: "/publish" });
  };

  return (
    <AppLayout>
      <PageHeader
        title="تصميم صور بالذكاء"
        subtitle="Pollinations Flux مجاني بلا حدود — أو استخدم مفتاحك الخاص"
        action={
          <Link to="/video">
            <Button variant="outline">
              <Video className="h-4 w-4" /> فيديو
            </Button>
          </Link>
        }
      />

      <div className="mb-4"><RateLimitBar kind="image" /></div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div>
              <Label>وصف الصورة</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="مثال: منظر طبيعي لجبال عند الغروب، ألوان دافئة، تصوير احترافي"
              />
            </div>

            <div>
              <Label>مزوّد التوليد</Label>
              <Select value={provider} onChange={(e) => changeProvider(e.target.value as typeof provider)}>
                {PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key} title={p.label}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <div className="mt-1.5 flex gap-1.5">
                <Badge tone={provider === "pollinations" ? "success" : "warning"}>
                  {provider === "pollinations" ? "مجاني — بلا مفتاح" : "يحتاج مفتاحك الخاص"}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAnime}
              title="يضيف: anime style, studio ghibli, cel shaded, vibrant colors"
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm transition ${
                anime ? "border-accent bg-accent/10" : "border-border bg-surface-elevated hover:border-accent/50"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                ✨ وضع الأنمي
                <Badge tone="accent">أنمي</Badge>
              </span>
              <span className={`h-5 w-9 rounded-full p-0.5 transition ${anime ? "bg-accent" : "bg-border"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${anime ? "translate-x-0" : "translate-x-4"}`} />
              </span>
            </button>

            <div>
              <Label>ستايل جاهز (نقل ستايل)</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStyle("")}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    style === "" ? "border-accent bg-accent/10" : "border-border bg-surface-elevated"
                  }`}
                >
                  بدون
                </button>
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    title={s.modifier}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      style === s.key ? "border-accent bg-accent/10" : "border-border bg-surface-elevated hover:border-accent/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <details className="rounded-xl border border-border bg-surface-elevated p-3">
              <summary className="cursor-pointer text-sm font-semibold">🖼️ صورة مرجعية (Image-to-Image)</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <Label>رابط صورة مرجعية عام (يفعّل img2img)</Label>
                  <input
                    value={refUrl}
                    onChange={(e) => setRefUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <Label>أو ارفع صورة (يُستخدم وصفها في المطالبة)</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground hover:border-accent/50">
                    <Upload className="h-4 w-4" />
                    اختر صورة من جهازك
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onRefFile(e.target.files?.[0])} />
                  </label>
                </div>
                <div>
                  <Label>وصف ستايل المرجع</Label>
                  <input
                    value={refDesc}
                    onChange={(e) => setRefDesc(e.target.value)}
                    placeholder="مثال: لوحة زيتية بألوان دافئة وضربات فرشاة سميكة"
                    className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
            </details>

            <div>
              <Label>نسبة الأبعاد</Label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAspect(a.key)}
                    className={`rounded-xl border p-3 text-right text-sm transition ${
                      aspect === a.key ? "border-accent bg-accent/10" : "border-border bg-surface-elevated hover:border-accent/50"
                    }`}
                  >
                    <div className="font-semibold">{a.key}</div>
                    <div className="text-xs text-muted-foreground">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={!prompt.trim() || loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "جاري التوليد..." : provider === "pollinations" ? "توليد 4 صور" : "توليد صورة"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <span className="font-semibold">الدفعة الحالية</span>
          </div>
          {batch.length ? (
            <>
              <ImageGrid images={batch} />
              <div className="mt-3 space-y-2">
                {batch.map((b, i) => (
                  <div key={b.url} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-elevated p-2">
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">صورة {i + 1}</span>
                    <Button variant="outline" onClick={() => downloadImg(b.url)}>
                      <Download className="h-4 w-4" /> تنزيل
                    </Button>
                    <Button variant="outline" onClick={() => copyLink(b.url)}>
                      <LinkIcon className="h-4 w-4" /> نسخ الرابط
                    </Button>
                    <Button variant="outline" onClick={() => useInPost(b.url)}>
                      <Wand2 className="h-4 w-4" /> استخدم في المنشور
                    </Button>
                    <Button onClick={() => {
                      setPreviewDraft({ text: prompt, hashtags: [], imageUrl: b.url });
                      navigate({ to: "/publish" });
                    }}>
                      <Send className="h-4 w-4" /> نشر
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <div>ستظهر الصور المولّدة هنا</div>
            </div>
          )}
        </Card>
      </div>

      {images.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">المكتبة</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-border">
                <img src={img.url} alt={img.prompt} className="aspect-square w-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 p-1.5 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => downloadImg(img.url)} className="flex items-center gap-1 rounded px-2 text-[11px] text-white">
                    <Download className="h-3.5 w-3.5" /> تنزيل
                  </button>
                  <button onClick={() => removeImage(img.id)} className="flex items-center gap-1 rounded px-2 text-[11px] text-white">
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
