import { getSession, isSeller } from "@/lib/session";
import { redirect, unstable_rethrow } from "next/navigation";
import { AnnoncesList } from "./AnnoncesList";
import { fetchMyAnnonces } from "../actions";
import type { Annonce, PaginatedResponse } from "@/types/api";

export default async function AnnoncesPage() {
  const session = await getSession();
  if (!isSeller(session)) redirect("/dashboard");

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
