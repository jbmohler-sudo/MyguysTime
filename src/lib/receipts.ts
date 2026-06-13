import { API_BASE } from "./api";

const TOKEN_STORAGE_KEY = "crew-timecard-token";

/**
 * Compress an image File to a JPEG data URL, capped at maxDimension on the
 * longest edge. Keeps job-site uploads small and fast on weak signal while
 * staying perfectly readable for receipts.
 */
export function compressImageToDataUrl(file: File, maxDimension = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the photo."));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing is not supported on this device."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch a short-lived signed URL for an expense's receipt and open it in a new
 * tab. The view endpoint verifies ownership server-side, so this needs auth.
 */
export async function openReceipt(expenseId: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) throw new Error("Not authenticated.");
  const response = await fetch(`${API_BASE}/expenses/${expenseId}/receipt`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error("Could not load the receipt.");
  }
  // The endpoint redirects to a signed URL; fetch follows it, so response.url
  // is the final signed image URL.
  window.open(response.url, "_blank", "noopener,noreferrer");
}
