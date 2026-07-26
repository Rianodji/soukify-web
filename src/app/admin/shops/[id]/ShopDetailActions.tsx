"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { approveShop, rejectShop, suspendShop, unsuspendShop } from "../../actions";
import { Button } from "@/components/ui/Button";
import type { ShopStatus } from "@/types/api";

interface ShopDetailActionsProps {
  shopId: string;
  status: ShopStatus;
}

export function ShopDetailActions({ shopId, status }: ShopDetailActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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

  const errorBanner = error && (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
      <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
      <p className="text-sm text-error">{error}</p>
    </div>
  );

  if (status === "PENDING") {
    return (
      <div className="space-y-2">
        {errorBanner}
        <Button size="md" variant="primary" loading={pending} className="w-full"
          onClick={() => run(() => approveShop(shopId))}>
          ✓ Approuver la boutique
        </Button>
        <Button size="md" variant="secondary" loading={pending}
          className="w-full text-error border-error hover:bg-error-light"
          onClick={() => {
            if (confirm("Rejeter définitivement cette demande ?")) run(() => rejectShop(shopId));
          }}>
          ✗ Rejeter la demande
        </Button>
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <div className="space-y-2">
        {errorBanner}
        <Button size="md" variant="secondary" loading={pending}
          className="w-full text-error border-error hover:bg-error-light"
          onClick={() => {
            if (confirm("Suspendre cette boutique ?")) run(() => suspendShop(shopId));
          }}>
          Suspendre la boutique
        </Button>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className="space-y-2">
        {errorBanner}
        <Button size="md" variant="secondary" loading={pending}
          className="w-full text-success border-success hover:bg-success-light"
          onClick={() => run(() => unsuspendShop(shopId))}>
          Réactiver la boutique
        </Button>
      </div>
    );
  }

  return null;
}
