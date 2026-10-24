type Option = { key: string; label?: string };

function Shape({ ratio, active }: { ratio: string; active: boolean }) {
  const [w, h] = ratio.split(":").map(Number);
  const max = 18;
  const sw = w >= h ? max : Math.round((max * w) / h);
  const sh = h >= w ? max : Math.round((max * h) / w);
  return (
    <span className="flex h-5 w-5 items-center justify-center" aria-hidden>
      <span
        style={{ width: sw, height: sh }}
        className={`rounded-[3px] border-2 ${active ? "border-primary-foreground" : "border-current"}`}
      />
    </span>
  );
}

export function AspectPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Option[];
  value: string;
  onChange: (key: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-[0_0_18px_-4px_var(--primary)]"
                : "bg-surface-elevated/60 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <Shape ratio={o.key} active={active} />
            <span dir="ltr">{o.key}</span>
            {o.label && <span className="font-normal opacity-80">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
