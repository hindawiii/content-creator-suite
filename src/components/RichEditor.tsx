import { useRef, useState, useEffect } from "react";
import { Bold, Italic, Smile, Type } from "lucide-react";

// Unicode transform tables (works on all social platforms since they're real Unicode chars)
const BOLD_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const az = "abcdefghijklmnopqrstuvwxyz";
  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const d = "0123456789";
  // Mathematical Bold
  for (let i = 0; i < 26; i++) m[az[i]] = String.fromCodePoint(0x1d41a + i);
  for (let i = 0; i < 26; i++) m[AZ[i]] = String.fromCodePoint(0x1d400 + i);
  for (let i = 0; i < 10; i++) m[d[i]] = String.fromCodePoint(0x1d7ce + i);
  return m;
})();
const ITALIC_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const az = "abcdefghijklmnopqrstuvwxyz";
  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 26; i++) m[az[i]] = i === 7 ? "\u210E" : String.fromCodePoint(0x1d44e + i);
  for (let i = 0; i < 26; i++) m[AZ[i]] = String.fromCodePoint(0x1d434 + i);
  return m;
})();
function transform(s: string, map: Record<string, string>) {
  return Array.from(s).map((c) => map[c] ?? c).join("");
}

export const ARABIC_FONTS = [
  { id: "cairo", label: "Cairo — عصري", css: '"Cairo", sans-serif' },
  { id: "tajawal", label: "Tajawal — نظيف", css: '"Tajawal", sans-serif' },
  { id: "ibm", label: "IBM Plex — تقني", css: '"IBM Plex Sans Arabic", sans-serif' },
  { id: "almarai", label: "Almarai — سميك", css: '"Almarai", sans-serif' },
  { id: "amiri", label: "Amiri — كلاسيكي", css: '"Amiri", serif' },
] as const;

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "شائع", emojis: ["🔥","✨","💡","🚀","🎯","💯","👏","🙌","❤️","🤍","⭐","✅","📌","🎉","💪","🧠"] },
  { label: "مشاعر", emojis: ["😀","😂","🥹","😍","🤩","😎","🤔","😮","🤯","😴","🥳","😭","😅","😉","🙃","😇"] },
  { label: "أعمال", emojis: ["💼","📈","📊","💰","💳","🏆","🎯","📅","📝","✍️","📚","🔗","📱","💻","⏰","🗓️"] },
  { label: "تسويق", emojis: ["📣","📢","🎬","📸","🎨","🖌️","🌐","🔎","👀","🏷️","🛍️","🤝","💬","📩","🔔","🎁"] },
  { label: "رموز", emojis: ["👉","👈","☑️","❌","➡️","⬅️","⬆️","⬇️","▶️","◀️","🔺","🔻","🟢","🟡","🔴","🔵"] },
];

export function RichEditor({
  value,
  onChange,
  rows = 10,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [font, setFont] = useState<(typeof ARABIC_FONTS)[number]["id"]>("cairo");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const fontRef = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setFontOpen(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const currentFont = ARABIC_FONTS.find((f) => f.id === font)!;

  const withSelection = (fn: (sel: string, before: string, after: string) => string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const sel = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = fn(sel, before, after);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const newPos = before.length + (sel.length ? sel.length : 0);
      el.setSelectionRange(newPos, newPos);
    });
  };

  const applyBold = () =>
    withSelection((sel, b, a) => (sel ? b + transform(sel, BOLD_MAP) + a : value));
  const applyItalic = () =>
    withSelection((sel, b, a) => (sel ? b + transform(sel, ITALIC_MAP) + a : value));
  const insertEmoji = (e: string) =>
    withSelection((_sel, b, a) => b + e + a);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-elevated p-1.5">
        <div ref={fontRef} className="relative">
          <button
            type="button"
            onClick={() => { setFontOpen((v) => !v); setEmojiOpen(false); }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs hover:bg-surface"
            title="الخط"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="max-w-[110px] truncate">{currentFont.label.split(" — ")[0]}</span>
          </button>
          {fontOpen && (
            <div className="absolute z-30 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
              {ARABIC_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setFont(f.id); setFontOpen(false); }}
                  className={`block w-full px-3 py-2 text-right text-sm hover:bg-surface ${f.id === font ? "text-accent" : ""}`}
                  style={{ fontFamily: f.css }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={applyBold}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs hover:bg-surface"
          title="عريض (اختر النص أولاً)"
        >
          <Bold className="h-3.5 w-3.5" /> عريض
        </button>
        <button
          type="button"
          onClick={applyItalic}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs hover:bg-surface"
          title="مائل (اختر النص أولاً)"
        >
          <Italic className="h-3.5 w-3.5" /> مائل
        </button>

        <div ref={emojiRef} className="relative">
          <button
            type="button"
            onClick={() => { setEmojiOpen((v) => !v); setFontOpen(false); }}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs hover:bg-surface"
            title="إيموجي"
          >
            <Smile className="h-3.5 w-3.5" /> إيموجي
          </button>
          {emojiOpen && (
            <div className="absolute z-30 mt-1 w-72 rounded-xl border border-border bg-surface-elevated p-2 shadow-lg">
              {EMOJI_GROUPS.map((g) => (
                <div key={g.label} className="mb-2 last:mb-0">
                  <div className="mb-1 text-[10px] font-semibold text-muted-foreground">{g.label}</div>
                  <div className="grid grid-cols-8 gap-0.5">
                    {g.emojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => insertEmoji(e)}
                        className="rounded-md p-1 text-lg leading-none hover:bg-surface"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="mr-auto text-[10px] text-muted-foreground">
          {value.length.toLocaleString()} حرف
        </span>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        dir="auto"
        style={{ fontFamily: currentFont.css }}
        className="w-full rounded-xl border border-border bg-input px-4 py-3 text-[15px] leading-[1.9] outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
