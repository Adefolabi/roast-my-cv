const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Uploads a CV file to the backend and returns the roast findings.
 * @param {File} file - the CV file (PDF)
 * @param {string} voiceId - persona key, e.g. "savage", "dryBritishRecruiter"
 * @returns {Promise<{ findings: Array, voice: string }>}
 */
export async function submitRoast(file, voiceId) {
  const formData = new FormData();
  formData.append("cv", file);
  formData.append("voice", voiceId);

  const res = await fetch(`${API_BASE}/api/roast`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Resolves a sticker path returned by the API (e.g. "/assets/stickers/...")
 * into a full URL against the backend origin. Returns null if there's no
 * sticker to show.
 * @param {string|null} stickerPath
 * @returns {string|null}
 */
export function resolveStickerUrl(stickerPath) {
  return stickerPath ? `${API_BASE}${stickerPath}` : null;
}

/**
 * Renders a shareable PNG "roast card" summarizing the given findings.
 * @param {Array} findings - findings as returned by submitRoast (category, roastLine, sticker, ...)
 * @param {string} voiceId - persona key, e.g. "savage"
 * @returns {Promise<Blob>} PNG image blob
 */
export async function fetchShareCard(findings, voiceId) {
  const res = await fetch(`${API_BASE}/api/share-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ findings, voice: voiceId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.blob();
}
