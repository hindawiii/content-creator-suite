import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  STORAGE_CHANGED_EVENT,
  applyCloudSnapshot,
  buildCloudSnapshot,
  type CloudSnapshot,
} from "@/services/storage";

export const SYNC_STATUS_EVENT = "poston:sync-status";
export type SyncStatus = "off" | "syncing" | "synced" | "error";
let lastStatus: SyncStatus = "off";
export const getSyncStatus = () => lastStatus;
function emit(s: SyncStatus) {
  lastStatus = s;
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: s }));
}

/** Mirrors local data to the signed-in account: pulls & merges on sign-in, pushes on change. */
export function CloudSync() {
  const userId = useRef<string | null>(null);
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const push = async () => {
      const uid = userId.current;
      if (!uid) return;
      emit("syncing");
      const { error } = await supabase.from("user_snapshots").upsert({
        user_id: uid,
        data: buildCloudSnapshot() as never,
        updated_at: new Date().toISOString(),
      });
      emit(error ? "error" : "synced");
    };

    const pullThenPush = async (uid: string) => {
      userId.current = uid;
      emit("syncing");
      const { data, error } = await supabase
        .from("user_snapshots")
        .select("data")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) {
        emit("error");
        return;
      }
      if (data?.data) {
        applying.current = true;
        applyCloudSnapshot(data.data as CloudSnapshot);
        applying.current = false;
        window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT));
      }
      await push();
    };

    const onChange = () => {
      if (applying.current || !userId.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(push, 2500);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        userId.current = null;
        emit("off");
      } else if (event === "SIGNED_IN" && session?.user && session.user.id !== userId.current) {
        void pullThenPush(session.user.id).then(() => {
          if (lastStatus === "synced") toast.success("تمت مزامنة بياناتك مع حسابك");
        });
      }
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.id !== userId.current) void pullThenPush(data.user.id);
    });
    window.addEventListener(STORAGE_CHANGED_EVENT, onChange);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(STORAGE_CHANGED_EVENT, onChange);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
