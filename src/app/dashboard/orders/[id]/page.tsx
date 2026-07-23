import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "./OrderActions";
import type { Order, Annonce } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "neutral" }> = {
  PENDING_PAYMENT: { label: "En attente de paiement", variant: "warning" },
  PAID:            { label: "Payé",                   variant: "default" },
  CONFIRMED:       { label: "Confirmé",               variant: "default" },
  IN_DELIVERY:     { label: "En livraison",           variant: "default" },
  COMPLETED:       { label: "Complété",               variant: "success" },
  CANCELLED:       { label: "Annulé",                 variant: "neutral" },
  DISPUTED:        { label: "En litige",              variant: "error" },
};

const STEPS = [
  { status: "PENDING_PAYMENT", label: "Paiement" },
  { status: "PAID",            label: "Payé" },
  { status: "CONFIRMED",       label: "Confirmé" },
  { status: "IN_DELIVERY",     label: "En livraison" },
  { status: "COMPLETED",       label: "Complété" },
];

const STEP_ORDER = ["PENDING_PAYMENT", "PAID", "CONFIRMED", "IN_DELIVERY", "COMPLETED"];

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const [session, order] = await Promise.all([
    getSession(),
    serverGet<Order>(`/orders/${id}`, 0).catch(() => null),
  ]);

  if (!order) notFound();

  /* GET /orders/:id doesn't embed the annonce (only annonceId) — fetched
   * separately. Public endpoint, so a failure here shouldn't block the page. */
  const annonce = await serverGet<Annonce>(`/annonces/${order.annonceId}`, 0).catch(() => null);

  const isBuyer  = order.buyerId === session?.userId;
  const isSeller = order.sellerId === session?.userId;
  const status   = STATUS_CONFIG[order.status] ?? { label: order.status, variant: "neutral" as const };

  const currentStepIndex = STEP_ORDER.indexOf(order.status);
  const isTerminal = ["CANCELLED", "DISPUTED"].includes(order.status);

  const otherLabel = isBuyer ? "Vendeur" : "Acheteur";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors">
        <ChevronLeft className="w-4 h-4" /> Mes commandes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-text-disabled font-mono">#{order.id.slice(0, 16).toUpperCase()}</p>
            <h1 className="text-lg font-bold text-text-primary mt-0.5">
              {annonce?.title ?? "Commande"}
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
        </div>
      </div>

      {/* Progress timeline */}
      {!isTerminal && (
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Suivi de la commande</h2>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done  = currentStepIndex >= i;
              const active = currentStepIndex === i;
              return (
                <div key={step.status} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done
                        ? "bg-brand border-brand text-white"
                        : "bg-white border-border text-text-disabled"
                    } ${active ? "ring-4 ring-brand/20" : ""}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${done ? "text-brand font-medium" : "text-text-disabled"}`}>
                      {step.label}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${currentStepIndex > i ? "bg-brand" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isTerminal && order.status === "CANCELLED" && (
        <div className="bg-error-light border border-error rounded-2xl p-4 text-sm text-error font-medium text-center">
          Cette commande a été annulée.
        </div>
      )}
      {isTerminal && order.status === "DISPUTED" && (
        <div className="bg-warning-light border border-warning rounded-2xl p-4 text-sm text-warning font-medium text-center">
          Un litige est en cours sur cette commande. Notre équipe support va vous contacter.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Annonce */}
          <div className="bg-white rounded-2xl border border-border p-5 flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-50 overflow-hidden shrink-0 flex items-center justify-center">
              {annonce?.images?.[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={annonce.images[0]} alt="" className="w-full h-full object-cover" />
                : <Package className="w-8 h-8 text-primary-300" />
              }
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold text-text-primary">{annonce?.title ?? "—"}</p>
              <p className="text-sm text-text-secondary">{annonce?.city ?? order.city}</p>
              {annonce?.id && (
                <Link href={`/annonces/${annonce.id}`} target="_blank"
                  className="text-xs text-brand hover:underline">
                  Voir l&apos;annonce →
                </Link>
              )}
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-text-primary text-sm">Détail financier</h2>
            <dl className="space-y-2">
              {[
                { label: "Montant payé",      value: formatPrice(order.totalAmountCents / 100),                                        highlight: true },
                { label: "Commission Soukify", value: `− ${formatPrice(order.commissionCents / 100)}`,                                 dimmed: true },
                { label: "Net vendeur",        value: formatPrice((order.totalAmountCents - order.commissionCents) / 100), success: true },
              ].map(({ label, value, highlight, dimmed, success }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className={dimmed ? "text-text-disabled" : "text-text-secondary"}>{label}</span>
                  <span className={`font-semibold ${highlight ? "text-brand" : success ? "text-success" : "text-text-primary"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </dl>
          </div>

          {/* Other party — GET /orders/:id only gives buyerId/sellerId, no
           * name/phone/KYC, so we can only show the role label here. */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-text-primary text-sm">{otherLabel}</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold shrink-0">
                {otherLabel[0]}
              </div>
              <p className="text-sm font-medium text-text-primary">{otherLabel} de cette commande</p>
            </div>
          </div>
        </div>

        {/* Right — actions + meta */}
        <div className="space-y-4">
          {(isBuyer || isSeller) && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm">Actions</h2>
              <OrderActions orderId={order.id} status={order.status} isBuyer={isBuyer} />
            </div>
          )}

          <div className="bg-background rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Informations</p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-disabled">Statut</dt>
                <dd className="font-medium text-text-primary">{status.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Créée le</dt>
                <dd className="text-text-secondary">{new Date(order.createdAt).toLocaleString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Mise à jour</dt>
                <dd className="text-text-secondary">{new Date(order.updatedAt).toLocaleString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Votre rôle</dt>
                <dd className="font-medium text-text-primary">{isBuyer ? "Acheteur" : "Vendeur"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
