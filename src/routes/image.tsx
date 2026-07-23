import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Textarea, Label, Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { buildPollinationsUrls, type PollinationsImage } from "@/services/ai";
import { canUse, bumpUsage, remaining } from "@/lib/usage";
import { Image as ImageIcon, Sparkles, RefreshCw, Download, Trash2, Save } from "lucide-react";

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
      { title: "PostMind — تصميم صور بالذكاء" },
      { name: "description", content: "توليد صور احترافية بأبعاد مختلفة لكل المنصات." },
      { property: "og:title", content: "تصميم صور بالذكاء — PostMind" },
      { property: "og:description", content: "صور مولّدة بالذكاء لجميع منصات التواصل." },
    ],
  }),
  component: ImagePage,
});

function ImagePage() {
  const { images, addImage, removeImage, plan } = useStore();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<AspectKey>("1:1");
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState<PollinationsImage[]>([]);
  const [loadedSeeds, setLoadedSeeds] = useState<Record<number, boolean>>({});

  const dims = ASPECTS.find((a) => a.key === aspect)!;
  const imgRemaining = remaining("image", plan);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (!canUse("image", plan)) {
      toast.error(`وصلت الحد اليومي (${imgRemaining} صور متبقية). ارقِ خطتك للاستخدام غير المحدود.`);
      return;
    }
    setLoading(true);
    setLoadedSeeds({});
    const urls = buildPollinationsUrls(prompt, dims.w, dims.h, 4);
    setBatch(urls);
    bumpUsage("image");
    // Loading state clears when the first image loads; keep skeletons visible until then.
    setLoading(false);
    toast.success("جاري توليد 4 نسخ...");
  };

  const handleSave = (img: PollinationsImage) => {
    addImage({ prompt, aspectRatio: aspect, url: img.url });
    toast.success("تم حفظ الصورة في المكتبة");
  };

  return (
    <AppLayout>
      <PageHeader
        title="تصميم صور بالذكاء"
        subtitle="اوصف الصورة، اختر الأبعاد، واحصل على 4 نسخ للاختيار"
        action={
          imgRemaining !== Infinity ? (
            <Badge tone={imgRemaining > 0 ? "accent" : "warning"}>{imgRemaining} صور متبقية اليوم</Badge>
          ) : (
            <Badge tone="success">غير محدود</Badge>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <div className="space-y-4">
            <div>
              <Label>وصف الصورة</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                rows={5}
                placeholder="مثال: منظر طبيعي لجبال عند الغروب، ألوان دافئة، تصوير احترافي"
              />
              <div className="mt-1 text-[11px] text-muted-foreground">
                يُضاف تلقائياً: "social media post, professional design, modern style"
              </div>
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
              توليد 4 نسخ
            </Button>
            <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 text-xs text-muted-foreground">
              💡 مدعوم بـ <strong className="text-foreground">Pollinations.ai</strong> — مجاني بالكامل بدون مفاتيح.
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <span className="font-semibold">النتائج</span>
          </div>
          {batch.length ? (
            <div className="grid grid-cols-2 gap-3">
              {batch.map((img) => {
                const loaded = loadedSeeds[img.seed];
                return (
                  <div key={img.seed} className="group relative overflow-hidden rounded-xl border border-border bg-surface-elevated">
                    {!loaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                      </div>
                    )}
                    <img
                      src={img.url}
                      alt={`variant-${img.seed}`}
                      onLoad={() => setLoadedSeeds((s) => ({ ...s, [img.seed]: true }))}
                      className={`aspect-square w-full object-cover transition ${loaded ? "opacity-100" : "opacity-0"}`}
                    />
                    {loaded && (
                      <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                        <a href={img.url} download target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full !py-1.5 !text-xs">
                            <Download className="h-3.5 w-3.5" /> تنزيل
                          </Button>
                        </a>
                        <Button className="flex-1 !py-1.5 !text-xs" onClick={() => handleSave(img)}>
                          <Save className="h-3.5 w-3.5" /> حفظ
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <div>ستظهر 4 نسخ من الصورة هنا</div>
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
                <img src={img.url} alt={img.prompt} className="aspect-square w-full object-cover" />
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
