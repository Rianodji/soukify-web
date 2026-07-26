"use client";

import { useState, useTransition } from "react";
import { approveShop, rejectShop, suspendShop, unsuspendShop } from "../actions";
import { Button } from "@/components/ui/Button";
import type { ShopStatus } from "@/types/api";

interface ShopActionsProps {
  shopId: string;
  status: ShopStatus;
}

export function ShopActions({ shopId, status }: ShopActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  const errorText = error && <p className="text-xs text-error mt-1 max-w-[160px]">{error}</p>;

  if (status === "PENDING") {
    return (
      <div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => run(() => approveShop(shopId))}
            className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
            Approuver
          </Button>
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => run(() => rejectShop(shopId))}
            className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
            Rejeter
          </Button>
        </div>
        {errorText}
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <div>
        <Button size="sm" variant="secondary" loading={pending}
          onClick={() => run(() => suspendShop(shopId))}
          className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
          Suspendre
        </Button>
        {errorText}
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div>
        <Button size="sm" variant="secondary" loading={pending}
          onClick={() => run(() => unsuspendShop(shopId))}
          className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
          Réactiver
        </Button>
        {errorText}
      </div>
    );
  }

  return null;
}
