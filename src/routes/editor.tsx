import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent as RPE } from "react";
import { Copy, Download, ImagePlus, Trash2, Type, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { StudioTabs } from "@/components/StudioTabs";
import { Button, Card, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { BADGE_PAD, BADGE_PRESETS, FONTS, LINE_HEIGHT, newLayer, renderDesign, type Layer } from "@/lib/designEditor";
import { downloadBlob, loadImage } from "@/lib/imageTools";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "محرر النصوص والشارات — Post On" },
      { name: "description", content: "أضف نصوصًا عربية وشارات عروض فوق صورك وعدّلها بحرية ثم نزّلها PNG." },
      { property: "og:title", content: "محرر النصوص والشارات — Post On" },
      { property: "og:description", content: "حرّك وكبّر وغيّر خط ولون النصوص العربية فوق صورك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

const SIZES = [
  { label: "مربع 1:1", w: 1080, h: 1080 },
  { label: "طولي 4:5", w: 1080, h: 1350 },
  { label: "ستوري 9:16", w: 1080, h: 1920 },
  { label: "عرضي 16:9", w: 1920, h: 1080 },
];

function EditorPage() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [dims, setDims] = useState({ w: 1080, h: 1080 });
  const [bg, setBg] = useState("#0f2a3d");
  const [layers, setLayers] = useState<Layer[]>([newLayer("text", "اكتب عنوانك هنا", { y: 0.3 })]);
  const [sel, setSel] = useState<string | null>(null);
  const [stageW, setStageW] = useState(500);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!stage.current) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const current = layers.find((l) => l.id === sel) ?? null;
  const update = (patch: Partial<Layer>) =>
    setLayers((ls) => ls.map((l) => (l.id === sel ? { ...l, ...patch } : l)));
  const add = (l: Layer) => {
    setLayers((ls) => [...ls, l]);
    setSel(l.id);
  };

  async function onFile(f?: File) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    try {
      const i = await loadImage(url);
      setImg(i);
      setDims({ w: i.naturalWidth, h: i.naturalHeight });
    } catch {
      toast.error("تعذر قراءة الصورة");
    }
  }

  function onDown(e: RPE, id: string) {
    e.stopPropagation();
    setSel(id);
    const r = stage.current!.getBoundingClientRect();
    const l = layers.find((x) => x.id === id)!;
    drag.current = { id, dx: (e.clientX - r.left) / r.width - l.x, dy: (e.clientY - r.top) / r.height - l.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: RPE) {
    const d = drag.current;
    if (!d) return;
    const r = stage.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width - d.dx));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height - d.dy));
    setLayers((ls) => ls.map((l) => (l.id === d.id ? { ...l, x, y } : l)));
  }

  async function exportPng() {
    setBusy(true);
    try {
      const blob = await renderDesign({ width: dims.w, height: dims.h, image: img, bg, layers });
      downloadBlob(blob, `post-on-design-${Date.now()}.png`);
      toast.success("تم تنزيل التصميم");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التصدير");
    } finally {
      setBusy(false);
    }
  }

  const k = stageW / 1000;

  return (
    <AppLayout>
      <StudioTabs />
      <PageHeader
        title="محرر النصوص والشارات"
        subtitle="اضغط على أي نص لتعديله، واسحبه لتحريكه"
        action={
          <Button onClick={exportPng} disabled={busy}>
            <Download className="h-4 w-4" /> تنزيل PNG
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div
            ref={stage}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onPointerDown={() => setSel(null)}
            className="relative mx-auto w-full touch-none select-none overflow-hidden rounded-lg border border-border"
            style={{ aspectRatio: `${dims.w} / ${dims.h}`, maxHeight: "70dvh", maxWidth: `calc(70dvh * ${dims.w / dims.h})`, background: bg }}
          >
            {img && <img src={img.src} alt="" className="absolute inset-0 h-full w-full" draggable={false} />}
            {layers.map((l) => {
              const fs = l.size * k;
              return (
                <div
                  key={l.id}
                  onPointerDown={(e) => onDown(e, l.id)}
                  className={`absolute cursor-move whitespace-pre text-center ${sel === l.id ? "outline outline-2 outline-offset-4 outline-accent" : ""}`}
                  style={{
                    left: `${l.x * 100}%`,
                    top: `${l.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${l.rotate}deg)`,
                    fontFamily: `"${l.font}"`,
                    fontWeight: l.weight,
                    fontSize: fs,
                    lineHeight: LINE_HEIGHT,
                    color: l.color,
                    direction: "rtl",
                    background: l.kind === "badge" ? l.bg : undefined,
                    padding: l.kind === "badge" ? `${BADGE_PAD.y}em ${BADGE_PAD.x}em` : 0,
                    borderRadius: l.kind === "badge" ? `${l.radius}em` : 0,
                    textShadow: l.shadow ? `0 ${fs * 0.06}px ${fs * 0.25}px rgba(0,0,0,.55)` : undefined,
                  }}
                >
                  {l.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <Label>الخلفية</Label>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {img ? "تغيير الصورة" : "ارفع صورة"}
            </Button>
            {!img && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {SIZES.map((s) => (
                    <Button key={s.label} variant={dims.w === s.w && dims.h === s.h ? "primary" : "outline"} onClick={() => setDims({ w: s.w, h: s.h })}>
                      {s.label}
                    </Button>
                  ))}
                </div>
                <label className="flex items-center justify-between text-sm">
                  لون الخلفية <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-14 rounded" />
                </label>
              </>
            )}
            {img && (
              <Button variant="ghost" className="w-full" onClick={() => setImg(null)}>
                إزالة الصورة
              </Button>
            )}
          </Card>

          <Card className="space-y-3">
            <Label>أضف</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => add(newLayer("text", "نص جديد"))}>
                <Type className="h-4 w-4" /> نص
              </Button>
              <Button variant="outline" onClick={() => add(newLayer("badge", "شارة"))}>
                <Tag className="h-4 w-4" /> شارة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {BADGE_PRESETS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => add(newLayer("badge", p.text, { ...p, y: 0.8 }))}
                  className="rounded-full px-3 py-1.5 text-sm font-bold"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.text}
                </button>
              ))}
            </div>
          </Card>

          {current ? (
            <Card className="space-y-3">
              <Label>تعديل العنصر المحدد</Label>
              <Textarea rows={2} value={current.text} onChange={(e) => update({ text: e.target.value })} dir="rtl" />
              <Select value={current.font} onChange={(e) => update({ font: e.target.value })}>
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <Select value={current.weight} onChange={(e) => update({ weight: Number(e.target.value) as Layer["weight"] })}>
                <option value={400}>عادي</option>
                <option value={700}>عريض</option>
                <option value={800}>عريض جدًا</option>
              </Select>
              <label className="block text-sm">
                الحجم: {current.size}
                <input type="range" min={16} max={200} value={current.size} onChange={(e) => update({ size: Number(e.target.value) })} className="w-full" />
              </label>
              <label className="block text-sm">
                الدوران: {current.rotate}°
                <input type="range" min={-45} max={45} value={current.rotate} onChange={(e) => update({ rotate: Number(e.target.value) })} className="w-full" />
              </label>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  لون النص <input type="color" value={current.color} onChange={(e) => update({ color: e.target.value })} className="h-9 w-12 rounded" />
                </label>
                {current.kind === "badge" && (
                  <label className="flex items-center gap-2">
                    لون الشارة <input type="color" value={current.bg} onChange={(e) => update({ bg: e.target.value })} className="h-9 w-12 rounded" />
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={current.shadow} onChange={(e) => update({ shadow: e.target.checked })} /> ظل
                </label>
              </div>
              {current.kind === "badge" && (
                <label className="block text-sm">
                  استدارة الحواف
                  <input type="range" min={0} max={2} step={0.1} value={current.radius} onChange={(e) => update({ radius: Number(e.target.value) })} className="w-full" />
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => add({ ...current, id: newLayer("text", "").id, x: Math.min(1, current.x + 0.05), y: Math.min(1, current.y + 0.05) })}>
                  <Copy className="h-4 w-4" /> تكرار
                </Button>
                <Button variant="outline" onClick={() => { setLayers((ls) => ls.filter((l) => l.id !== sel)); setSel(null); }}>
                  <Trash2 className="h-4 w-4" /> حذف
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">اضغط على نص أو شارة في التصميم لتعديله.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
