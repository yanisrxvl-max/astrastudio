import type { ContentFile } from "@/types/database";

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const LIMITS = {
  video: 5 * GB,
  photo: 200 * MB,
  document: 50 * MB,
  other: 50 * MB,
} as const;

export function classifyMime(mime: string): ContentFile["file_type"] {
  const m = mime.toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("image/")) return "photo";
  if (
    m === "application/pdf" ||
    m.includes("word") ||
    m.includes("document") ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }
  return "other";
}

export function validateContentFile(file: File): { ok: true } | { ok: false; error: string } {
  const type = classifyMime(file.type || "application/octet-stream");
  const max = LIMITS[type];
  if (file.size > max) {
    const maxLabel =
      type === "video"
        ? "5 Go"
        : type === "photo"
          ? "200 Mo"
          : "50 Mo";
    return {
      ok: false,
      error: `"${file.name}" dépasse la limite (${maxLabel}) pour ce type de fichier.`,
    };
  }

  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() ?? "" : "";

  if (type === "video" && file.type && !file.type.startsWith("video/")) {
    return { ok: false, error: `Fichier non reconnu comme vidéo : ${file.name}` };
  }
  if (type === "photo" && file.type && !file.type.startsWith("image/")) {
    return { ok: false, error: `Fichier non reconnu comme image : ${file.name}` };
  }

  return { ok: true };
}
