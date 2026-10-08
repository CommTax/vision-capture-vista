const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE ?? "").replace(/\/$/, "");

/**
 * Backend returns the R2 object key in drills.audio_url.
 *
 * Current backend value: "<account-id>/drills/<uuid>.webm"
 * Actual R2 object path: "drills/<uuid>.webm"
 *
 * So we normalize by cutting everything up to and including "drills/".
 * If the key already starts at "drills/", we use it as-is.
 * If the value is a full URL, we honor it verbatim.
 */
export function toAudioUrl(keyOrUrl: string | null | undefined): string | undefined {
  if (!keyOrUrl) return undefined;
  if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
  if (!R2_BASE) {
    console.warn("[r2] VITE_R2_PUBLIC_BASE missing");
    return undefined;
  }

  // Strip everything before "drills/" (e.g. the Cloudflare account ID prefix)
  const idx = keyOrUrl.indexOf("drills/");
  const normalized = idx >= 0 ? keyOrUrl.slice(idx) : keyOrUrl.replace(/^\//, "");

  return `${R2_BASE}/${normalized}`;
}
