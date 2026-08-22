import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

/**
 * Saves an uploaded file under public/uploads/<folder>/ with a random name
 * (never trusting the client-supplied filename) and returns its public URL.
 * Caller is responsible for validating mime type/size against the allow-list
 * before calling this.
 */
export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const ext = EXT_BY_MIME[file.type] ?? "";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { ok: true } | { ok: false; error: string } {
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Unsupported file type." };
  }
  if (file.size > maxSize) {
    return { ok: false, error: `File is too large (max ${(maxSize / (1024 * 1024)).toFixed(0)}MB).` };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }
  return { ok: true };
}
