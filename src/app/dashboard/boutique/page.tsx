import { redirect, unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { BoutiqueView } from "./BoutiqueView";
import { fetchBoutiqueData, type BoutiqueData } from "../actions";

type Tab = "apercu" | "annonces" | "equipe" | "abonnement" | "parametres";

interface BoutiquePageProps {
  searchParams: Promise<{ tab?: Tab; status?: string }>;
}

export default async function BoutiquePage({ searchParams }: BoutiquePageProps) {
  const session = await getSession();
  if (!session?.roles.includes("PRO_SELLER")) redirect("/dashboard");

  const sp = await searchParams;
  const tab = sp.tab ?? "apercu";
  const annonceStatus = sp.status ?? "";
  const needsAnnonces = tab === "annonces" || tab === "apercu";

  let initialData: BoutiqueData = { shop: null, stats: null, annonces: [], annoncesTotal: 0 };
  try {
    initialData = await fetchBoutiqueData(needsAnnonces, annonceStatus);
  } catch (e) { unstable_rethrow(e); /* BoutiqueView handles the empty state */ }

  return <BoutiqueView initialData={initialData} tab={tab} annonceStatus={annonceStatus} />;
}
