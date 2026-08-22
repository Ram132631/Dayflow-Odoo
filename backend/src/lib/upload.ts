import path from "path";
import crypto from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import multer from "multer";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

// Memory storage — we validate mime/size ourselves before writing to disk,
// and never trust the client-supplied filename.
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export function validateFile(
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): { ok: true } | { ok: false; error: string } {
  if (!allowedTypes.includes(file.mimetype)) {
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

export function saveUploadedFile(file: Express.Multer.File, folder: string): string {
  const ext = EXT_BY_MIME[file.mimetype] ?? "";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, filename), file.buffer);
  return `/uploads/${folder}/${filename}`;
}
