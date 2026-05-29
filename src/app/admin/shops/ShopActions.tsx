"use client";

import { useTransition } from "react";
import { approveShop, rejectShop, suspendShop, unsuspendShop } from "../actions";
import { Button } from "@/components/ui/Button";
import type { ShopStatus } from "@/types/api";

interface ShopActionsProps {
  shopId: string;
  status: ShopStatus;
}

export function ShopActions({ shopId, status }: ShopActionsProps) {
  const [pending, startTransition] = useTransition();

  if (status === "PENDING") {
    return (
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="secondary" loading={pending}
          onClick={() => startTransition(() => approveShop(shopId))}
          className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
          Approuver
        </Button>
        <Button size="sm" variant="secondary" loading={pending}
          onClick={() => startTransition(() => rejectShop(shopId))}
          className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
          Rejeter
        </Button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <Button size="sm" variant="secondary" loading={pending}
        onClick={() => startTransition(() => suspendShop(shopId))}
        className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
        Suspendre
      </Button>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <Button size="sm" variant="secondary" loading={pending}
        onClick={() => startTransition(() => unsuspendShop(shopId))}
        className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
        Réactiver
      </Button>
    );
  }

  return null;
}
