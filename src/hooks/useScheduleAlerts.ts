import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { schedulesStore } from "@/services/storage";

const FIRED_KEY = "poston_notified_ids";
const STORE_KEY = "postmind:v1";

export type NotifPermission = "unsupported" | "default" | "granted" | "denied";

export function getNotifPermission(): NotifPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotifPermission;
}

interface DueItem {
  id: string;
  platform: string;
  time: string;
  content?: string;
}

/** Collects due items from both sources: the schedules store and scheduled posts in the app store. */
export function collectDue(now = Date.now()): DueItem[] {
  const out: DueItem[] = [];
  schedulesStore
    .list()
    .filter((s) => s.status === "pending" && new Date(s.scheduledTime).getTime() <= now)
    .forEach((s) => out.push({ id: s.id, platform: s.platform, time: s.scheduledTime }));

  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { posts?: { id: string; platform: string; status: string; scheduledAt?: string; content?: string }[] };
      (parsed.posts ?? [])
        .filter((p) => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt).getTime() <= now)
        .forEach((p) => out.push({ id: p.id, platform: p.platform, time: p.scheduledAt!, content: p.content }));
    }
  } catch {
    /* ignore corrupted store */
  }
  return out;
}

function readFired(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Polls due schedules and alerts via a browser notification, falling back to an in-app toast. */
export function useScheduleAlerts() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const fired = readFired();
      const due = collectDue().filter((d) => !fired.includes(d.id));
      if (due.length === 0) return;

      for (const item of due) {
        const body = `حان وقت نشر منشورك على ${item.platform}`;
        if (getNotifPermission() === "granted") {
          try {
            const n = new Notification("Post On — حان وقت النشر!", { body, icon: "/icon-192.png", tag: item.id });
            n.onclick = () => {
              window.focus();
              window.location.href = "/publish";
            };
          } catch {
            toast.message("حان وقت النشر!", { description: body });
          }
        } else {
          toast.message("حان وقت النشر!", { description: body, duration: 8000 });
        }
        fired.push(item.id);
      }
      localStorage.setItem(FIRED_KEY, JSON.stringify(fired.slice(-200)));
    };

    check();
    const id = setInterval(check, 30000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

/** Exposes notification permission state plus a request action for settings/schedule UI. */
export function useNotifPermission() {
  const [permission, setPermission] = useState<NotifPermission>("unsupported");

  useEffect(() => setPermission(getNotifPermission()), []);

  const request = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast.error("متصفحك لا يدعم التنبيهات");
      return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      toast.error("التنبيهات محجوبة — فعّلها من إعدادات المتصفح");
      return false;
    }
    const res = await Notification.requestPermission();
    setPermission(res as NotifPermission);
    if (res === "granted") {
      toast.success("تم تفعيل التنبيهات — سنذكّرك عند موعد كل منشور");
      return true;
    }
    toast.error("لم يتم تفعيل التنبيهات");
    return false;
  }, []);

  return { permission, request };
}
