/**
 * Upload constraints shared by client forms and the server-side store. Kept
 * separate from lib/uploads.ts so client components can read the limits without
 * pulling in server-only code.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Formats patients actually have: phone photos, scans and hospital PDFs. */
export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "application/dicom",
];

export const ALLOWED_UPLOAD_EXTENSIONS = /\.(pdf|jpe?g|png|webp|heic|heif|tiff?|dcm)$/i;

export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff,.dcm";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
