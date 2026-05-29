"use client";

import { useTransition } from "react";
import { resolveTicket, assignTicketToSelf, reopenTicket } from "../actions";
import { Button } from "@/components/ui/Button";
import type { TicketStatus } from "@/types/api";

interface TicketActionsProps {
  ticketId: string;
  status: TicketStatus;
  isAssigned: boolean;
}

export function TicketActions({ ticketId, status, isAssigned }: TicketActionsProps) {
  const [pending, startTransition] = useTransition();

  if (status === "CLOSED") return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(status === "OPEN" || status === "IN_PROGRESS") && (
        <>
          {!isAssigned && (
            <Button size="sm" variant="secondary" loading={pending}
              onClick={() => startTransition(() => assignTicketToSelf(ticketId))}
              className="text-brand border-brand hover:bg-primary-50 text-xs h-7 px-2">
              Prendre en charge
            </Button>
          )}
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => startTransition(() => resolveTicket(ticketId))}
            className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
            Résoudre
          </Button>
        </>
      )}
      {status === "RESOLVED" && (
        <Button size="sm" variant="secondary" loading={pending}
          onClick={() => startTransition(() => reopenTicket(ticketId))}
          className="text-warning border-warning hover:bg-warning-light text-xs h-7 px-2">
          Rouvrir
        </Button>
      )}
    </div>
  );
}
