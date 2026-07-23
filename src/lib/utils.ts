import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "XAF"): string {
  return new Intl.NumberFormat("fr-TD", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "").replace(/^235/, "");
  return `+235 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`.trim();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * True only for a same-site relative path — rejects protocol-relative
 * (`//evil.com`) and backslash tricks (`/\evil.com`, browsers normalize
 * `\` to `/`) that `path.startsWith("/")` alone would let through.
 */
export function isSafeInternalPath(path: string): boolean {
  return /^\/(?!\/|\\)/.test(path);
}
