import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui";

export interface GridImage {
  url: string;
  seed: number;
}

export function ImageGrid({ images }: { images: GridImage[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((img) => (
          <button
            key={img.seed}
            onClick={() => setPreview(img.url)}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface-elevated"
          >
            <img
              src={img.url}
              alt={`seed-${img.seed}`}
              className="aspect-square w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
              <span>seed {img.seed}</span>
              <span>معاينة</span>
            </div>
          </button>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="preview" className="max-h-[80vh] w-auto rounded-xl" />
            <div className="mt-3 flex gap-2">
              <a href={preview} download target="_blank" rel="noreferrer" className="flex-1">
                <Button className="w-full">
                  <Download className="h-4 w-4" /> تنزيل
                </Button>
              </a>
              <Button variant="outline" onClick={() => setPreview(null)}>
                <X className="h-4 w-4" /> إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
