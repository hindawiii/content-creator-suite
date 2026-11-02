import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, Button, Badge, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { SYNC_STATUS_EVENT, getSyncStatus, type SyncStatus } from "@/components/CloudSync";
import { Cloud, CloudOff, LogIn, LogOut, User, Camera, Loader2 } from "lucide-react";

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: "غير متزامن",
  syncing: "جارٍ المزامنة…",
  synced: "محفوظ سحابيًا",
  error: "تعذّرت المزامنة",
};

/** Resizes an image file to a small square JPEG data URL for the profile photo. */
function toAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function AccountCard({ plan }: { plan: string }) {
  const { user, profile, saveProfile, signOut } = useAuth();
  const [sync, setSync] = useState<SyncStatus>("off");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSync(getSyncStatus());
    const h = (e: Event) => setSync((e as CustomEvent<SyncStatus>).detail);
    window.addEventListener(SYNC_STATUS_EVENT, h);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, h);
  }, []);
  useEffect(() => setName(profile?.display_name ?? ""), [profile]);

  if (!user) {
    return (
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated">
            <CloudOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold">بياناتك محفوظة على هذا الجهاز فقط</div>
            <div className="text-sm text-muted-foreground">
              سجّل الدخول لحفظها سحابيًا ومزامنتها بين أجهزتك.
            </div>
          </div>
          <Link to="/auth">
            <Button>
              <LogIn className="h-4 w-4" /> تسجيل الدخول
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const onPhoto = async (f?: File) => {
    if (!f) return;
    try {
      await saveProfile({ avatar_url: await toAvatarDataUrl(f) });
      toast.success("تم تحديث الصورة");
    } catch {
      toast.error("تعذّر حفظ الصورة");
    }
  };

  return (
    <Card className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          aria-label="تغيير الصورة"
          onClick={() => fileRef.current?.click()}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full gradient-primary"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="m-auto h-6 w-6 text-primary-foreground" />
          )}
          <Camera className="absolute bottom-0 left-0 h-4 w-4 rounded-full bg-background p-0.5 text-foreground" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{profile?.display_name || user.email}</div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
            {user.email}
          </div>
        </div>
        <Badge tone={sync === "error" ? "warning" : "accent"}>
          <Cloud className="h-3.5 w-3.5" /> {SYNC_LABEL[sync]}
        </Badge>
        <Badge tone="accent">{plan === "pro" ? "Pro" : "Free"}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-0 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
        />
        <Button
          variant="outline"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await saveProfile({ display_name: name.trim() || null });
              toast.success("تم حفظ الاسم");
            } catch {
              toast.error("تعذّر الحفظ");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
        </Button>
        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" /> خروج
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        مفاتيح API تبقى على هذا الجهاز فقط ولا تُرفع إلى حسابك.
      </div>
    </Card>
  );
}
