"use client";

import { useTransition } from "react";
import { approveReport, dismissReport } from "../actions";
import { Button } from "@/components/ui/Button";
import type { ReportStatus } from "@/types/api";

interface ReportActionsProps {
  reportId: string;
  status: ReportStatus;
}

export function ReportActions({ reportId, status }: ReportActionsProps) {
  const [pending, startTransition] = useTransition();

  if (status !== "PENDING") return null;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() => startTransition(() => approveReport(reportId))}
        className="text-error border-error hover:bg-error-light text-xs h-7 px-2"
      >
        Approuver
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() => startTransition(() => dismissReport(reportId))}
        className="text-text-secondary text-xs h-7 px-2"
      >
        Ignorer
      </Button>
    </div>
  );
}
