import type { Annonce } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";
/** Strip the `/api/v1` suffix — uploads are served from the API's origin, not under the API prefix. */
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

/** Price in XAF units, regardless of which endpoint the annonce came from. */
export function getAnnoncePriceXAF(a: Annonce): number {
  if (a.priceXAF !== undefined) return a.priceXAF;
  if (a.priceCents !== undefined) return a.priceCents / 100;
  return 0;
}

/**
 * Primary image URL, regardless of which endpoint the annonce came from.
 *
 * Rebuilt from the storage key (`primaryImageStorageKey`/`primaryImage`)
 * using our own configured API origin whenever available, rather than
 * trusting the API's `primaryImageUrl` verbatim — that field is built
 * server-side from the API's own `BASE_URL` env var, which in production
 * has been observed misconfigured to `http://localhost:3020`, making every
 * annonce image fail to load (cf. HANDOFF_INFRA.md, 2026-07-27). Falls back
 * to `primaryImageUrl` only if no storage key is present at all.
 */
export function getAnnonceImageUrl(a: Annonce): string | undefined {
  const key = a.primaryImageStorageKey ?? a.primaryImage;
  if (key) return `${API_ORIGIN}/uploads/${key}`;
  if (a.primaryImageUrl) return a.primaryImageUrl;
  return undefined;
}
