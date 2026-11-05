import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eraser, FileImage, RefreshCw, Shapes, Upload, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Badge, Button, Card, Label, PageHeader } from "@/components/ui";
import {
  FORMAT_META,
  TRACE_PRESETS,
  baseName,
  convertImage,
  downloadBlob,
  formatBytes,
  removeBackground,
  vectorizeImage,
  type ModelProgress,
  type OutputFormat,
  type TracePreset,
} from "@/lib/imageTools";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "أدوات الصور المجانية — Post On" },
      {
        name: "description",
        content:
          "فرّغ خلفية أي صورة إلى PNG شفاف، حوّل الشعارات إلى SVG، وغيّر صيغة الصور وحجمها مجاناً داخل جهازك.",
      },
      { property: "og:title", content: "أدوات الصور المجانية — Post On" },
      {
        property: "og:description",
        content: "تفريغ الخلفية، تحويل إلى SVG، وتحويل الصيغ وضغطها — مجاناً وبدون رفع صورك لأي خادم.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToolsPage,
});

type Tool = "bg" | "svg" | "convert";

const TOOLS: { key: Tool; label: string; icon: typeof Eraser; hint: string }[] = [
  { key: "bg", label: "تفريغ الخلفية", icon: Eraser, hint: "PNG شفاف للمنتجات والأشخاص" },
  { key: "svg", label: "تحويل إلى SVG", icon: Shapes, hint: "للشعارات والأيقونات والرسومات" },
  { key: "convert", label: "تحويل الصيغة", icon: FileImage, hint: "PNG / JPG / WebP مع ضغط الحجم" },
];

interface Source {
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

interface Result {
  url: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

function ToolsPage() {
  const [tool, setTool] = useState<Tool>("bg");
  const [source, setSource] = useState<Source | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<ModelProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tool options
  const [preset, setPreset] = useState<TracePreset>("logo");
  const [colors, setColors] = useState(TRACE_PRESETS.logo.colors);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(85);
  const [maxSide, setMaxSide] = useState(0);

  // Free object URLs when they are replaced.
  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source.url);
  }, [source]);
  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const pickFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر ملف صورة (PNG أو JPG أو WebP)");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSource({
        url,
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setResult(null);
    };
    img.onerror = () => toast.error("تعذر فتح هذه الصورة");
    img.src = url;
  };

  const changeTool = (t: Tool) => {
    setTool(t);
    setResult(null);
  };

  const run = async () => {
    if (!source) return;
    setBusy(true);
    setResult(null);
    setProgress(null);
    const name = baseName(source.name);
    try {
      let out: { blob: Blob; width: number; height: number };
      let filename: string;
      if (tool === "bg") {
        setStatus("جاري تجهيز محرك التفريغ على جهازك...");
        out = await removeBackground(source.url, (p) => {
          setProgress(p);
          setStatus("تنزيل محرك التفريغ (مرة واحدة فقط)...");
        });
        filename = `${name}-no-bg.png`;
      } else if (tool === "svg") {
        setStatus("جاري تتبع الحواف وتحويلها إلى مسارات...");
        out = await vectorizeImage(source.url, preset, colors);
        filename = `${name}.svg`;
      } else {
        setStatus("جاري التحويل...");
        out = await convertImage(source.url, format, { quality: quality / 100, maxSide });
        filename = `${name}.${FORMAT_META[format].ext}`;
      }
      setResult({ ...out, url: URL.createObjectURL(out.blob), filename });
      toast.success("جاهز للتنزيل");
    } catch (err) {
      console.error(err);
      toast.error(
        tool === "bg"
          ? "تعذر تفريغ الخلفية على هذا الجهاز. جرّب صورة أصغر أو متصفح Chrome محدّث."
          : "تعذرت معالجة الصورة. جرّب صورة أخرى.",
      );
    } finally {
      setBusy(false);
      setStatus("");
      setProgress(null);
    }
  };

  const pct = progress && progress.total ? Math.round((progress.loaded / progress.total) * 100) : null;
  const actionLabel =
    tool === "bg" ? "فرّغ الخلفية" : tool === "svg" ? "حوّل إلى SVG" : `حوّل إلى ${FORMAT_META[format].label}`;

  return (
    <AppLayout>
      <PageHeader
        title="أدوات الصور"
        subtitle="مجانية بالكامل وتعمل داخل جهازك — صورك لا تُرفع لأي خادم"
      />

      {/* Tool switcher */}
      <div role="tablist" aria-label="اختر الأداة" className="mb-5 grid grid-cols-3 gap-2">
        {TOOLS.map((t) => {
          const active = tool === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => changeTool(t.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                active
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-accent/50"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
              <span className="text-sm font-bold">{t.label}</span>
              <span className="hidden text-sm text-muted-foreground sm:block">{t.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            {/* Upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
            >
              {source ? (
                <div className="relative overflow-hidden rounded-xl border border-border bg-checker">
                  <img
                    src={source.url}
                    alt="الصورة الأصلية"
                    className="mx-auto max-h-72 w-auto object-contain"
                  />
                  <button
                    onClick={() => {
                      setSource(null);
                      setResult(null);
                    }}
                    aria-label="إزالة الصورة"
                    className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-overlay/70 text-on-overlay"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex justify-between gap-2 border-t border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
                    <span className="truncate" dir="ltr">
                      {source.name}
                    </span>
                    <span className="shrink-0" dir="ltr">
                      {source.width}×{source.height} · {formatBytes(source.size)}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className={`flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition ${
                    dragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                  }`}
                >
                  <Upload className="h-8 w-8" />
                  <span className="font-semibold text-foreground">ارفع صورة من جهازك</span>
                  <span className="text-sm">أو اسحبها وأفلتها هنا</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Options */}
            {tool === "bg" && (
              <div className="rounded-xl border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
                أول استخدام ينزّل محرك التفريغ (بين 45 و115 ميجابايت حسب جهازك) ويُحفظ في المتصفح، بعدها يعمل
                فوراً وبدون إنترنت تقريباً. الأفضل لصور المنتجات والأشخاص بخلفية واضحة.
              </div>
            )}

            {tool === "svg" && (
              <>
                <div>
                  <Label>نوع الصورة</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TRACE_PRESETS) as TracePreset[]).map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          setPreset(k);
                          setColors(TRACE_PRESETS[k].colors);
                        }}
                        className={`rounded-xl border px-2 py-2 text-sm transition ${
                          preset === k
                            ? "border-accent bg-accent/10 font-bold"
                            : "border-border bg-surface-elevated hover:border-accent/50"
                        }`}
                      >
                        {TRACE_PRESETS[k].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{TRACE_PRESETS[preset].hint}</p>
                </div>
                <div>
                  <Label>عدد الألوان: {colors}</Label>
                  <input
                    type="range"
                    min={2}
                    max={64}
                    value={colors}
                    onChange={(e) => setColors(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                    aria-label="عدد الألوان"
                  />
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
                  يعطي أفضل نتيجة مع الشعارات والرسومات المسطحة. الصور الفوتوغرافية تتحول إلى رسم
                  بألوان مبسطة وليست نسخة مطابقة.
                </div>
              </>
            )}

            {tool === "convert" && (
              <>
                <div>
                  <Label>الصيغة الجديدة</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FORMAT_META) as OutputFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`rounded-xl border px-2 py-2 text-sm transition ${
                          format === f
                            ? "border-accent bg-accent/10 font-bold"
                            : "border-border bg-surface-elevated hover:border-accent/50"
                        }`}
                      >
                        {FORMAT_META[f].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {format === "png"
                      ? "بدون فقد للجودة ويحافظ على الشفافية — حجم أكبر."
                      : format === "jpeg"
                        ? "الأكثر توافقاً — الشفافية تتحول إلى خلفية بيضاء."
                        : "الأصغر حجماً مع جودة عالية ويحافظ على الشفافية."}
                  </p>
                </div>
                {format !== "png" && (
                  <div>
                    <Label>الجودة: {quality}%</Label>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                      aria-label="الجودة"
                    />
                  </div>
                )}
                <div>
                  <Label>أقصى عرض أو ارتفاع</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 2048, 1080, 720].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMaxSide(m)}
                        className={`rounded-xl border px-2 py-2 text-sm transition ${
                          maxSide === m
                            ? "border-accent bg-accent/10 font-bold"
                            : "border-border bg-surface-elevated hover:border-accent/50"
                        }`}
                      >
                        {m === 0 ? "الأصلي" : m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button onClick={run} disabled={!source || busy} className="w-full">
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {busy ? status || "جاري المعالجة..." : actionLabel}
            </Button>
            {busy && pct !== null && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-center text-sm text-muted-foreground" dir="ltr">
                  {pct}% · {formatBytes(progress!.loaded)} / {formatBytes(progress!.total)}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-semibold">النتيجة</span>
            {result && <Badge tone="success">{result.filename.split(".").pop()?.toUpperCase()}</Badge>}
          </div>
          {result ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border bg-checker">
                <img src={result.url} alt="النتيجة" className="mx-auto max-h-80 w-auto object-contain" />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground" dir="ltr">
                <span>
                  {result.width}×{result.height}
                </span>
                <span>
                  {source && formatBytes(source.size)} → {formatBytes(result.blob.size)}
                </span>
              </div>
              <Button className="w-full" onClick={() => downloadBlob(result.blob, result.filename)}>
                <Download className="h-4 w-4" /> تنزيل {result.filename.split(".").pop()?.toUpperCase()}
              </Button>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <FileImage className="h-8 w-8 opacity-40" />
              <div>{busy ? status : "ارفع صورة واضغط الزر لتظهر النتيجة هنا"}</div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
