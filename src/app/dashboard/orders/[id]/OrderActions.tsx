"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDelivery, cancelOrder, disputeOrder } from "../../actions";
import type { OrderStatus } from "@/types/api";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  isBuyer: boolean;
}

export function OrderActions({ orderId, status, isBuyer }: OrderActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  const canConfirm  = isBuyer  && ["PAID", "CONFIRMED", "IN_DELIVERY"].includes(status);
  const canCancel   = ["PENDING_PAYMENT", "PAID"].includes(status);
  const canDispute  = !isBuyer && ["PAID", "CONFIRMED", "IN_DELIVERY"].includes(status) ||
                       isBuyer  && ["PAID", "CONFIRMED", "IN_DELIVERY"].includes(status);

  if (!canConfirm && !canCancel && !canDispute) return null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
          <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
      {canConfirm && (
        <Button size="md" variant="primary" className="w-full" loading={pending}
          onClick={() => {
            if (confirm("Confirmer la réception ? Le vendeur sera payé.")) {
              run(() => confirmDelivery(orderId));
            }
          }}>
          ✓ Confirmer la réception
        </Button>
      )}
      {canCancel && (
        <Button size="md" variant="secondary" className="w-full text-error border-error hover:bg-error-light" loading={pending}
          onClick={() => {
            if (confirm("Annuler cette commande ?")) run(() => cancelOrder(orderId));
          }}>
          Annuler la commande
        </Button>
      )}
      {canDispute && status !== "COMPLETED" && status !== "CANCELLED" && status !== "DISPUTED" && (
        <>
          {!showDisputeForm ? (
            <Button size="sm" variant="ghost" className="w-full text-warning text-xs"
              onClick={() => setShowDisputeForm(true)}>
              Signaler un problème
            </Button>
          ) : (
            <div className="space-y-2 p-3 rounded-xl border border-warning bg-warning-light">
              <p className="text-xs font-semibold text-amber-800">Motif du litige</p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
                placeholder="Décrivez le problème…"
                className="w-full text-sm p-2 rounded-lg border border-warning bg-white resize-none focus:outline-none"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1"
                  onClick={() => setShowDisputeForm(false)}>Annuler</Button>
                <Button size="sm" variant="primary" loading={pending} className="flex-1"
                  onClick={() => run(() => disputeOrder(orderId, disputeReason || undefined))}>
                  Ouvrir le litige
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
