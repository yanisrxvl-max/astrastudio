import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Montants en euros (factures, ledger, objectifs). `clients.monthly_price` est en centimes → utiliser `formatEurosFromCents`. */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/** Montants en centimes (devis `quotes` : lignes, sous-total, total). */
export function formatEurosFromCents(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} Ko`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1).replace(".", ",")} Go`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  if (diffWeeks < 5) return `il y a ${diffWeeks}sem`;
  return `il y a ${diffMonths}mois`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function generateQuoteNumber(sequenceNum: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNum).padStart(3, "0");
  return `ASTRA-${year}-${padded}`;
}

/** Prochain numéro de séquence à partir de la liste des `quote_number` existants. */
export function nextSequenceFromQuoteNumbers(quoteNumbers: string[]): number {
  let max = 0;
  for (const n of quoteNumbers) {
    const m = n.match(/ASTRA-\d{4}-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

export function formatDateShortFr(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function firstNameFromFullName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}
