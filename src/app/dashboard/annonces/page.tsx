import { unstable_rethrow } from "next/navigation";
import { AnnoncesList } from "./AnnoncesList";
import { fetchMyAnnonces } from "../actions";
import type { Annonce, PaginatedResponse } from "@/types/api";

/**
 * No `isSeller(session)` gate here on purpose: the JWT's `roles` claim only
 * refreshes on login, so a buyer whose KYC was *just* approved (SELLER
 * granted server-side, cf. HANDOFF_INFRA.md, 2026-07-27) keeps a stale
 * session showing only BUYER — redirecting them away from this page bounced
 * them right back to /dashboard immediately after creating a draft annonce,
 * with no way to find it (the nav link was hidden by the same stale check).
 * Just render whatever this account's own annonces are — empty for someone
 * who's never sold anything, which is harmless.
 */
export default async function AnnoncesPage() {
  let initialData: PaginatedResponse<Annonce> = { items: [], total: 0 };
  try {
    initialData = await fetchMyAnnonces("limit=20");
  } catch (e) { unstable_rethrow(e); /* AnnoncesList handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <AnnoncesList initialData={initialData} />
    </div>
  );
}
