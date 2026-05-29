"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveTicket, assignTicketToSelf, reopenTicket } from "../../actions";
import { Button } from "@/components/ui/Button";
import type { TicketStatus } from "@/types/api";

interface TicketDetailActionsProps {
  ticketId: string;
  status: TicketStatus;
  isAssigned: boolean;
}

export function TicketDetailActions({ ticketId, status, isAssigned }: TicketDetailActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status === "CLOSED") return null;

  async function handleAction(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {(status === "OPEN" || status === "IN_PROGRESS") && (
        <>
          {!isAssigned && (
            <Button
              size="md"
              variant="primary"
              loading={pending}
              onClick={() => handleAction(() => assignTicketToSelf(ticketId))}
              className="w-full"
            >
              Prendre en charge
            </Button>
          )}
          <Button
            size="md"
            variant="secondary"
            loading={pending}
            onClick={() => handleAction(() => resolveTicket(ticketId))}
            className="w-full text-success border-success hover:bg-success-light"
          >
            Marquer comme résolu
          </Button>
        </>
      )}
      {status === "RESOLVED" && (
        <Button
          size="md"
          variant="secondary"
          loading={pending}
          onClick={() => handleAction(() => reopenTicket(ticketId))}
          className="w-full text-warning border-warning hover:bg-warning-light"
        >
          Rouvrir le ticket
        </Button>
      )}
    </div>
  );
}
