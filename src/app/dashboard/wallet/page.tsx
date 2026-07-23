import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession, isSeller } from "@/lib/session";
import { redirect, unstable_rethrow } from "next/navigation";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface WalletData {
  balance: number;
  pendingAmount: number;
  totalEarned: number;
  transactions?: Array<{
    id: string; type: "CREDIT" | "DEBIT"; amount: number;
    description: string; createdAt: string;
  }>;
}

export default async function WalletPage() {
  const session = await getSession();
  if (!isSeller(session)) redirect("/dashboard");

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-1 p-5 rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Solde disponible</p>
          <p className="text-3xl font-bold mt-2">{formatPrice(wallet?.balance ?? 0)}</p>
          <div className="mt-3 flex items-center gap-1.5 text-white/80 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            Prêt au retrait
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border space-y-1">
          <p className="text-xs text-text-secondary font-medium">En attente</p>
          <p className="text-xl font-bold text-text-primary">{formatPrice(wallet?.pendingAmount ?? 0)}</p>
          <p className="text-xs text-text-disabled">Commandes en cours</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border space-y-1">
          <p className="text-xs text-text-secondary font-medium">Total gagné</p>
          <p className="text-xl font-bold text-text-primary">{formatPrice(wallet?.totalEarned ?? 0)}</p>
          <p className="text-xs text-text-disabled flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success" /> Depuis le début</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Historique des transactions</h3>
        </div>
        {!wallet?.transactions?.length ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center px-4">
            <Wallet className="w-10 h-10 text-border" />
            <p className="text-text-secondary text-sm">Aucune transaction pour le moment.</p>
            <p className="text-text-disabled text-xs">Les revenus de vos ventes apparaîtront ici.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {wallet.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "CREDIT" ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
                  {tx.type === "CREDIT"
                    ? <ArrowDownLeft className="w-4 h-4" />
                    : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                  <p className="text-xs text-text-secondary">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${tx.type === "CREDIT" ? "text-success" : "text-error"}`}>
                  {tx.type === "CREDIT" ? "+" : "-"}{formatPrice(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
