import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AuditEntry } from "@/types/api";

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

/**
 * `AuditEntry.payload` is the raw shape each command handler happened to log
 * (e.g. `{ role }` for `user.role.add`, `{ resolution }` for `ticket.resolve`)
 * — not a pre-formatted string (cf. HANDOFF_INFRA.md, 2026-07-27). Falls back
 * to the target type/id so every entry still shows something concrete.
 */
export function formatAuditDetail(entry: AuditEntry): string | null {
  const payload = entry.payload;
  if (payload) {
    if (typeof payload.role === "string") return `Rôle : ${payload.role}`;
    if (typeof payload.resolution === "string") return payload.resolution;
  }
  if (entry.targetType && entry.targetId) {
    return `${entry.targetType} #${entry.targetId.slice(0, 8)}`;
  }
  return null;
}
