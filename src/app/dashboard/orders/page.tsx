import { getSession } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Order, PaginatedResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "neutral" }> = {
  PENDING_PAYMENT: { label: "En attente de paiement", variant: "warning" },
  PAID:            { label: "Payé",                   variant: "default" },
  CONFIRMED:       { label: "Confirmé",               variant: "default" },
  IN_DELIVERY:     { label: "En livraison",           variant: "default" },
  COMPLETED:       { label: "Complété",               variant: "success" },
  CANCELLED:       { label: "Annulé",                 variant: "neutral" },
  DISPUTED:        { label: "En litige",              variant: "error" },
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<Order>>("/orders?limit=20", 0);
    orders = res.items;
    total = res.total;
  } catch {
    /* handled below */
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Mes commandes</h2>
          <p className="text-sm text-text-secondary mt-0.5">{total} commande{total !== 1 ? "s" : ""} au total</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <ShoppingBag className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucune commande pour le moment.</p>
          <Link href="/" className="text-sm text-brand hover:underline flex items-center gap-1">
            Parcourir les annonces <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status] ?? { label: order.status, variant: "neutral" as const };
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border hover:border-brand hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-xl shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {order.annonceTitle ?? "Commande #" + order.id.slice(0, 8)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-bold text-brand">{formatPrice(order.totalAmountCents / 100)}</span>
                    <span className="text-xs text-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                <ArrowRight className="w-4 h-4 text-text-disabled shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
