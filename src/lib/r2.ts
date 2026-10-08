const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE ?? "").replace(/\/$/, "");

/**
 * Backend stores an R2 object key in drills.audio_url
 * (e.g. "63c677.../drills/<uuid>.webm"). This converts it to
 * a browser-playable public URL.
 *
 * If the backend ever starts returning a full URL, we honor it as-is.
 */
export function toAudioUrl(keyOrUrl: string | null | undefined): string | undefined {
  if (!keyOrUrl) return undefined;
  if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
  if (!R2_BASE) {
    console.warn("[r2] VITE_R2_PUBLIC_BASE missing — audio URLs will be broken");
    return undefined;
  }
  return `${R2_BASE}/${keyOrUrl.replace(/^\//, "")}`;
}
