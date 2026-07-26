import { unstable_rethrow } from "next/navigation";
import { BoutiqueView } from "./BoutiqueView";
import { fetchBoutiqueData, type BoutiqueData } from "../actions";

type Tab = "apercu" | "annonces" | "equipe" | "abonnement" | "parametres";

interface BoutiquePageProps {
  searchParams: Promise<{ tab?: Tab; status?: string }>;
}

/**
 * No `PRO_SELLER` session gate — same stale-JWT-role issue as
 * /dashboard/annonces and /dashboard/wallet (cf. HANDOFF_INFRA.md,
 * 2026-07-27). A buyer whose shop was just approved would have this page
 * redirect them away right when they most want to see it. `BoutiqueView`
 * already renders `CreateShopForm` gracefully when `shop` is null.
 */
export default async function BoutiquePage({ searchParams }: BoutiquePageProps) {
  const sp = await searchParams;
  const tab = sp.tab ?? "apercu";
  const annonceStatus = sp.status ?? "";
  const needsAnnonces = tab === "annonces" || tab === "apercu";

  let initialData: BoutiqueData = { shop: null, stats: null, annonces: [], annoncesTotal: 0, memberNames: {}, canSell: false };
  try {
    initialData = await fetchBoutiqueData(needsAnnonces, annonceStatus);
  } catch (e) { unstable_rethrow(e); /* BoutiqueView handles the empty state */ }

  return <BoutiqueView initialData={initialData} tab={tab} annonceStatus={annonceStatus} />;
}
