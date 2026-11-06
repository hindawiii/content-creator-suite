// Layer model + export for the Arabic text/badge editor. Positions are fractions of the
// design (0..1, layer centre); font sizes are relative to a 1000px-wide design.

export type Layer = {
  id: string;
  kind: "text" | "badge";
  text: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  font: string;
  weight: 400 | 700 | 800;
  color: string;
  bg: string;
  radius: number; // em
  shadow: boolean;
};

export const FONTS = [
  { value: "Cairo Variable", label: "Cairo" },
  { value: "Tajawal", label: "Tajawal" },
  { value: "Almarai", label: "Almarai" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex" },
  { value: "Amiri", label: "Amiri" },
];

export const LINE_HEIGHT = 1.3;
export const BADGE_PAD = { x: 0.8, y: 0.4 };

export function newLayer(kind: Layer["kind"], text: string, extra: Partial<Layer> = {}): Layer {
  return {
    id: Math.random().toString(36).slice(2, 10),
    kind,
    text,
    x: 0.5,
    y: 0.5,
    size: kind === "badge" ? 48 : 72,
    rotate: 0,
    font: "Cairo Variable",
    weight: 800,
    color: "#ffffff",
    bg: "#e11d48",
    radius: kind === "badge" ? 0.6 : 0,
    shadow: kind === "text",
    ...extra,
  };
}

export const BADGE_PRESETS: Array<Partial<Layer> & { text: string }> = [
  { text: "خصم 50%", bg: "#e11d48", color: "#ffffff" },
  { text: "جديد", bg: "#16a34a", color: "#ffffff", radius: 2 },
  { text: "اطلب الآن", bg: "#ffffff", color: "#0f172a" },
  { text: "عرض لفترة محدودة", bg: "#f59e0b", color: "#111827", radius: 0.3 },
  { text: "توصيل مجاني", bg: "#0ea5e9", color: "#ffffff", radius: 2 },
];

/** Draw the background (image or flat colour) and every layer at full resolution. */
export async function renderDesign(opts: {
  width: number;
  height: number;
  image?: HTMLImageElement | null;
  bg: string;
  layers: Layer[];
}) {
  await document.fonts.ready;
  const { width: W, height: H } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, W, H);
  if (opts.image) ctx.drawImage(opts.image, 0, 0, W, H);
  const k = W / 1000;
  for (const l of opts.layers) {
    const fs = l.size * k;
    const lines = l.text.split("\n");
    ctx.save();
    ctx.translate(l.x * W, l.y * H);
    ctx.rotate((l.rotate * Math.PI) / 180);
    ctx.font = `${l.weight} ${fs}px "${l.font}"`;
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = fs * LINE_HEIGHT;
    const tw = Math.max(...lines.map((s) => ctx.measureText(s).width));
    const th = lh * lines.length;
    if (l.kind === "badge") {
      const bw = tw + BADGE_PAD.x * 2 * fs;
      const bh = th + BADGE_PAD.y * 2 * fs;
      ctx.fillStyle = l.bg;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, -bh / 2, bw, bh, Math.min(l.radius * fs, bh / 2));
      ctx.fill();
    }
    if (l.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = fs * 0.25;
      ctx.shadowOffsetY = fs * 0.06;
    }
    ctx.fillStyle = l.color;
    lines.forEach((s, i) => ctx.fillText(s, 0, -th / 2 + lh * (i + 0.5)));
    ctx.restore();
  }
  return new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("فشل التصدير"))), "image/png"));
}
