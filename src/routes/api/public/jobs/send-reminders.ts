import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { getVapidKeys } from "@/lib/vapid.server";

interface Sched {
  id: string;
  platform: string;
  scheduledTime: string;
  status: string;
  content?: string;
}

const PLATFORM_AR: Record<string, string> = {
  instagram: "إنستقرام",
  twitter: "X",
  facebook: "فيسبوك",
  linkedin: "لينكدإن",
  tiktok: "تيك توك",
  youtube: "يوتيوب",
  whatsapp: "واتساب",
  telegram: "تلغرام",
};

export const Route = createFileRoute("/api/public/jobs/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { buildPushPayload } = await import("@block65/webcrypto-web-push");
        const vapid = await getVapidKeys();

        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh, auth");
        if (!subs?.length) return Response.json({ sent: 0 });

        const userIds = [...new Set(subs.map((s) => s.user_id))];
        const [{ data: snaps }, { data: sentRows }] = await Promise.all([
          supabaseAdmin.from("user_snapshots").select("user_id, data").in("user_id", userIds),
          supabaseAdmin.from("reminders_sent").select("user_id, schedule_id").in("user_id", userIds),
        ]);
        const sent = new Set((sentRows ?? []).map((r) => `${r.user_id}:${r.schedule_id}`));
        const now = Date.now();
        let delivered = 0;

        for (const snap of snaps ?? []) {
          const list = ((snap.data as { schedules?: Sched[] })?.schedules ?? []).filter((s) => {
            const t = new Date(s.scheduledTime).getTime();
            return (
              s.status === "pending" &&
              t <= now &&
              t > now - 24 * 3600 * 1000 &&
              !sent.has(`${snap.user_id}:${s.id}`)
            );
          });
          if (!list.length) continue;
          const userSubs = subs.filter((s) => s.user_id === snap.user_id);

          for (const item of list) {
            const body = JSON.stringify({
              title: "Post On — حان وقت النشر",
              body: `منشورك على ${PLATFORM_AR[item.platform] ?? item.platform}: ${(item.content ?? "").slice(0, 90)}`,
              tag: item.id,
              url: "/publish",
            });
            for (const sub of userSubs) {
              const payload = await buildPushPayload(
                { data: body, options: { ttl: 3600 } },
                { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                vapid,
              );
              const res = await fetch(sub.endpoint, payload);
              if (res.status === 404 || res.status === 410) {
                await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
              } else if (res.ok) delivered++;
            }
            await supabaseAdmin
              .from("reminders_sent")
              .upsert({ user_id: snap.user_id, schedule_id: item.id });
          }
        }
        return Response.json({ sent: delivered });
      },
    },
  },
});
