/**
 * Permanent video storage: every generated clip is kept on this device (IndexedDB),
 * and copied to the signed-in user's private cloud folder when an account is present.
 */
import { supabase } from "@/integrations/supabase/client";
import { videosStore, type VideoRecord } from "@/services/storage";

const DB = "poston_media";
const STORE = "videos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const putLocalVideo = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id));
export const getLocalVideo = (id: string) =>
  tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const deleteLocalVideo = (id: string) => tx("readwrite", (s) => s.delete(id));

/** Turns any generator output (blob, blob: URL or https URL) into a Blob, or null if the host blocks it. */
export async function toBlob(src: Blob | string): Promise<Blob | null> {
  if (typeof src !== "string") return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const b = await res.blob();
    return b.size > 0 ? b : null;
  } catch {
    return null;
  }
}

/** Saves a generated clip permanently and returns its record plus whether it reached the cloud. */
export async function saveVideo(
  src: Blob | string,
  prompt: string,
): Promise<{ record: VideoRecord; local: boolean; cloud: boolean }> {
  const blob = await toBlob(src);
  const remoteUrl = typeof src === "string" && /^https?:/.test(src) ? src : "";
  const record = videosStore.add({ url: remoteUrl, prompt });
  let local = false;
  let cloud = false;
  if (blob) {
    try {
      await putLocalVideo(record.id, blob);
      local = true;
    } catch {
      /* storage full or private mode */
    }
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const path = `${u.user.id}/${record.id}.mp4`;
      const { error } = await supabase.storage
        .from("videos")
        .upload(path, blob, { contentType: blob.type || "video/mp4", upsert: true });
      if (!error) {
        videosStore.update(record.id, { storagePath: path });
        cloud = true;
      }
    }
  }
  if (!local && !cloud && !remoteUrl) videosStore.remove(record.id);
  const saved = videosStore.list().find((v) => v.id === record.id) ?? record;
  return { record: saved, local, cloud };
}

/** Resolves a playable URL: device copy first, then the cloud copy, then the original link. */
export async function resolveVideoUrl(rec: VideoRecord): Promise<string | null> {
  try {
    const blob = await getLocalVideo(rec.id);
    if (blob) return URL.createObjectURL(blob);
  } catch {
    /* ignore */
  }
  if (rec.storagePath) {
    const { data } = await supabase.storage.from("videos").createSignedUrl(rec.storagePath, 3600);
    if (data?.signedUrl) return data.signedUrl;
  }
  return rec.url || null;
}

export async function deleteVideo(rec: VideoRecord) {
  videosStore.remove(rec.id);
  await deleteLocalVideo(rec.id).catch(() => {});
  if (rec.storagePath) await supabase.storage.from("videos").remove([rec.storagePath]);
}
