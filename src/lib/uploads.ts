import "server-only";

import { db } from "@/lib/db";
import type { NewFile } from "@/lib/db/repo";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-limits";

export interface UploadResult {
  key: string;
  size: number;
  filename: string;
  contentType: string;
}

export class UploadError extends Error {}

function assertAcceptable(file: File) {
  if (file.size === 0) throw new UploadError(`"${file.name}" is empty.`);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `"${file.name}" is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB. Please upload a smaller scan or split the file.`,
    );
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED_UPLOAD_TYPES.includes(type) && !ALLOWED_UPLOAD_EXTENSIONS.test(file.name)) {
    throw new UploadError(
      `"${file.name}" is not a supported file type. Upload a PDF or a photo of the report.`,
    );
  }
}

/** Validates and stores one uploaded file in a private bucket. */
export async function storeUpload(file: File, bucket: NewFile["bucket"]): Promise<UploadResult> {
  assertAcceptable(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const stored = await db.putFile({
    bucket,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    bytes,
  });
  return {
    key: stored.key,
    size: stored.size,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  };
}

/** Pulls every non-empty File under `field` out of a FormData. */
export function filesFrom(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}
