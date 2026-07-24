"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  if (status === "PENDING") {
    return (
      <div className="space-y-2">
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
      <Button size="md" variant="secondary" loading={pending}
        className="w-full text-error border-error hover:bg-error-light"
        onClick={() => {
          if (confirm("Suspendre cette boutique ?")) run(() => suspendShop(shopId));
        }}>
        Suspendre la boutique
      </Button>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <Button size="md" variant="secondary" loading={pending}
        className="w-full text-success border-success hover:bg-success-light"
        onClick={() => run(() => unsuspendShop(shopId))}>
        Réactiver la boutique
      </Button>
    );
  }

  return null;
}
