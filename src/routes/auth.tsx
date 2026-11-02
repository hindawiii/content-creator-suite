import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader, Button, Input, Label } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Post On — تسجيل الدخول" },
      { name: "description", content: "سجّل الدخول لحفظ منشوراتك وصورك سحابيًا ومزامنتها بين أجهزتك." },
      { property: "og:title", content: "تسجيل الدخول — Post On" },
      { property: "og:description", content: "حساب اختياري لمزامنة بياناتك بين الأجهزة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/settings", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") navigate({ to: "/settings", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async () => {
    if (!email || password.length < 6) {
      toast.error("أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) toast.success("أرسلنا رابط تأكيد إلى بريدك — افتحه لتفعيل الحساب");
      }
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg.includes("Invalid login") ? "البريد أو كلمة المرور غير صحيحة" : msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("تعذّر الدخول بحساب Google");
  };

  return (
    <AppLayout>
      <PageHeader
        title={mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}
        subtitle="الحساب اختياري — يحفظ منشوراتك وصورك وجدولتك سحابيًا ويزامنها بين أجهزتك"
      />
      <Card className="mx-auto max-w-md space-y-4">
        <Button variant="outline" className="w-full" onClick={google}>
          المتابعة بحساب Google
        </Button>
        <div className="text-center text-sm text-muted-foreground">أو بالبريد الإلكتروني</div>
        {mode === "up" && (
          <div>
            <Label>الاسم</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>كلمة المرور</Label>
          <Input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <Button className="w-full" onClick={submit} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "in" ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {mode === "in" ? "دخول" : "إنشاء الحساب"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "ليس لديك حساب؟ أنشئ حسابًا" : "لديك حساب؟ سجّل الدخول"}
        </button>
      </Card>
    </AppLayout>
  );
}
