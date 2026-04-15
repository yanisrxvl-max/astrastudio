/**
 * Règles d’upload « Mes envois » (client → admin).
 */

export const CLIENT_UPLOAD_MAX_BYTES = 500 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "tiff",
  "tif",
  "mp4",
  "mov",
  "pdf",
  "docx",
  "pptx",
  "zip",
]);

export function extensionOf(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base.slice(i + 1).toLowerCase();
}

export function classifyClientUploadType(
  mime: string,
  name: string
): "brief" | "asset" | "photo" | "document" | "other" {
  const ext = extensionOf(name);
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "tiff", "tif"].includes(ext)) {
    return "photo";
  }
  if (mime.startsWith("video/") || ["mp4", "mov"].includes(ext)) {
    return "asset";
  }
  if (
    mime.includes("pdf") ||
    mime.includes("wordprocessingml") ||
    mime.includes("presentationml") ||
    ["pdf", "docx", "pptx"].includes(ext)
  ) {
    return "document";
  }
  if (mime.includes("zip") || ext === "zip") {
    return "asset";
  }
  if (/brief/i.test(name)) return "brief";
  return "other";
}

export function validateClientUploadFile(file: File): string | null {
  if (file.size > CLIENT_UPLOAD_MAX_BYTES) {
    return "La taille maximale est de 500 Mo par fichier.";
  }
  const ext = extensionOf(file.name);
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return "Type de fichier non autorisé (images, vidéos, PDF, Office, ZIP).";
  }
  return null;
}
