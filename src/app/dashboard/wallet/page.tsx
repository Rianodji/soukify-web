import { serverGet } from "@/infrastructure/http/ApiServer";
import { unstable_rethrow } from "next/navigation";
import { Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";

/**
 * `GET /wallet` real shape (confirmed against `GetWalletHandler`, cf.
 * HANDOFF_INFRA.md, 2026-07-27): only `balanceCents`/`pendingBalanceCents`/
 * `currency` — amounts in cents (÷100 for XAF, same convention as every
 * other `*Cents` field in the app). No "total earned" field and no
 * transaction-history endpoint exist anywhere in the domain — this page
 * previously read `balance`/`pendingAmount`/`totalEarned`/`transactions`,
 * none of which the API has ever returned, so it silently showed 0 XAF
 * and an empty history regardless of the real balance.
 */
interface WalletData {
  balanceCents: number;
  pendingBalanceCents: number;
  currency: string;
}

/**
 * No `isSeller(session)` gate — same stale-JWT-role issue as
 * /dashboard/annonces (cf. HANDOFF_INFRA.md, 2026-07-27). Already handled
 * gracefully below (empty-wallet state) if `/wallet` errors for a
 * non-seller, so the redirect was pure downside with no safety benefit.
 */
export default async function WalletPage() {
  let wallet: WalletData | null = null;
  try {
    wallet = await serverGet<WalletData>("/wallet", 0);
  } catch (e) {
    unstable_rethrow(e);
    /* handled below */
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-text-primary">Mon portefeuille</h2>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Solde disponible</p>
          <p className="text-3xl font-bold mt-2">{formatPrice((wallet?.balanceCents ?? 0) / 100)}</p>
          <div className="mt-3 flex items-center gap-1.5 text-white/80 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            Prêt au retrait
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border space-y-1">
          <p className="text-xs text-text-secondary font-medium">En attente</p>
          <p className="text-xl font-bold text-text-primary">{formatPrice((wallet?.pendingBalanceCents ?? 0) / 100)}</p>
          <p className="text-xs text-text-disabled">Commandes en cours</p>
        </div>
      </div>

      {/* Historique des transactions : pas d'endpoint dédié côté API
          aujourd'hui (cf. HANDOFF_INFRA.md, 2026-07-27) — pas affiché
          plutôt que de montrer une liste vide en permanence. */}
    </div>
  );
}
