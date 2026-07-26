import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getCategories } from "@/lib/categories";
import { NewAnnonceForm } from "./NewAnnonceForm";
import type { MyProfile } from "@/types/api";

interface NewAnnoncePageProps {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function NewAnnoncePage({ searchParams }: NewAnnoncePageProps) {
  const { shopId } = await searchParams;
  const [categories, profile] = await Promise.all([
    getCategories(),
    serverGet<MyProfile>("/users/me", 0).catch((e: unknown) => { unstable_rethrow(e); return null; }),
  ]);

  /* POST /annonces and POST /annonces/:id/publish both 403 without an
   * approved KYC (cf. HANDOFF_INFRA.md, 2026-07-26) — gate the form
   * upfront on `canSell` rather than letting the user fill it out and
   * hit a 403 at submit time. */
  if (profile && !profile.canSell) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-warning p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-warning mx-auto" />
          <h2 className="text-lg font-bold text-text-primary">Vérifiez votre identité pour vendre</h2>
          <p className="text-sm text-text-secondary">
            Une vérification KYC approuvée est nécessaire avant de pouvoir créer une annonce.
          </p>
          <Link href="/dashboard/profile" className="inline-block text-sm font-medium text-brand hover:underline">
            Vérifier mon identité →
          </Link>
        </div>
      </div>
    );
  }

  return <NewAnnonceForm categories={categories} shopId={shopId} />;
}
