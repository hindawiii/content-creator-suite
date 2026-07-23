import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Image as ImageIcon, Sparkles, RefreshCw, Trash2, Send } from "lucide-react";
import { useImageGenerator } from "@/hooks/useAI";
import { ImageGrid, type GridImage } from "@/components/ImageGrid";
import { RateLimitBar } from "@/components/RateLimitBar";
import { imagesStore, analyticsStore, setPreviewDraft } from "@/services/storage";

const ASPECTS = [
  { key: "1:1", label: "مربع", w: 1024, h: 1024 },
  { key: "9:16", label: "عمودي (ستوري)", w: 720, h: 1280 },
  { key: "16:9", label: "أفقي", w: 1280, h: 720 },
  { key: "4:5", label: "منشور", w: 1024, h: 1280 },
] as const;
type AspectKey = (typeof ASPECTS)[number]["key"];

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "Post On — تصميم صور بالذكاء" },
      { name: "description", content: "توليد صور احترافية بأبعاد مختلفة عبر Pollinations.ai مباشرة من المتصفح." },
      { property: "og:title", content: "تصميم صور — Post On" },
      { property: "og:description", content: "أربع صور بذرات مختلفة لكل توليد." },
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
  const { generate, loading } = useImageGenerator();

  const dims = ASPECTS.find((a) => a.key === aspect)!;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const results = generate(prompt, { width: dims.w, height: dims.h });
    setBatch(results);
    // persist all four
    results.forEach((r) => {
      addImage({ prompt, aspectRatio: aspect, url: r.url });
      imagesStore.add({ prompt, url: r.url });
      analyticsStore.bumpImage();
    });
  };

  return (
    <AppLayout>
      <PageHeader title="تصميم صور بالذكاء" subtitle="Pollinations.ai مباشرة من المتصفح — بدون مفاتيح" />

      <div className="mb-4"><RateLimitBar kind="image" /></div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div>
              <Label>وصف الصورة</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="مثال: منظر طبيعي لجبال عند الغروب، ألوان دافئة، تصوير احترافي"
              />
            </div>
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
              {loading ? "جاري التوليد..." : "توليد 4 صور"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <span className="font-semibold">الدفعة الحالية (4 بذرات)</span>
          </div>
          {batch.length ? (
            <ImageGrid images={batch} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <div>ستظهر 4 صور هنا (seeds 1-4)</div>
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
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
