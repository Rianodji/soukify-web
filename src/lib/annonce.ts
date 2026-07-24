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

/** Primary image URL, regardless of which endpoint the annonce came from. */
export function getAnnonceImageUrl(a: Annonce): string | undefined {
  if (a.primaryImageUrl) return a.primaryImageUrl;
  if (a.primaryImage) return `${API_ORIGIN}/uploads/${a.primaryImage}`;
  return undefined;
}
