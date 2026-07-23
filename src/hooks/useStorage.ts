import { useCallback, useEffect, useState } from "react";
import {
  postsStore, imagesStore, schedulesStore, settingsStore,
  type PostRecord, type ImageRecord, type ScheduleRecord, type SettingsRecord,
} from "@/services/storage";

export function usePosts() {
  const [posts, setPosts] = useState<PostRecord[]>(() => postsStore.list());
  const refresh = useCallback(() => setPosts(postsStore.list()), []);
  const add = useCallback((p: Omit<PostRecord, "id" | "createdAt">) => {
    const rec = postsStore.add(p);
    refresh();
    return rec;
  }, [refresh]);
  const remove = useCallback((id: string) => { postsStore.remove(id); refresh(); }, [refresh]);
  return { posts, add, remove, refresh };
}

export function useImages() {
  const [images, setImages] = useState<ImageRecord[]>(() => imagesStore.list());
  const refresh = useCallback(() => setImages(imagesStore.list()), []);
  const add = useCallback((i: Omit<ImageRecord, "id" | "createdAt">) => {
    const rec = imagesStore.add(i);
    refresh();
    return rec;
  }, [refresh]);
  const remove = useCallback((id: string) => { imagesStore.remove(id); refresh(); }, [refresh]);
  return { images, add, remove, refresh };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(() => schedulesStore.list());
  const refresh = useCallback(() => setSchedules(schedulesStore.list()), []);
  const add = useCallback((s: Omit<ScheduleRecord, "id">) => {
    const rec = schedulesStore.add(s);
    refresh();
    return rec;
  }, [refresh]);
  const remove = useCallback((id: string) => { schedulesStore.remove(id); refresh(); }, [refresh]);
  return { schedules, add, remove, refresh };
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsRecord>(() => settingsStore.get());
  const update = useCallback((patch: Partial<SettingsRecord>) => {
    const next = settingsStore.set(patch);
    setSettings(next);
    return next;
  }, []);
  useEffect(() => {
    const onStorage = () => setSettings(settingsStore.get());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { settings, update };
}
