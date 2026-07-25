"use client";

import { Badge } from "@/components/ui/Badge";
import { usePolledData } from "@/hooks/usePolledData";
import { fetchAdminUserById } from "../../actions";
import type { AdminUser, KycStatus } from "@/types/api";

const KYC_CONFIG: Record<KycStatus, { label: string; variant: "success" | "warning" | "error" | "neutral" }> = {
  APPROVED:      { label: "KYC vérifié",    variant: "success" },
  PENDING:       { label: "KYC en attente", variant: "warning" },
  REJECTED:      { label: "KYC rejeté",     variant: "error" },
  EXPIRED:       { label: "KYC expiré",     variant: "error" },
  NOT_SUBMITTED: { label: "Non vérifié",    variant: "neutral" },
};

export function KycHeaderBadge({ userId, initialUser }: { userId: string; initialUser: AdminUser }) {
  const { data: user } = usePolledData(["admin-user", userId], () => fetchAdminUserById(userId), initialUser);
  const kyc = KYC_CONFIG[user?.kycStatus ?? "NOT_SUBMITTED"];
  return <Badge variant={kyc.variant}>{kyc.label}</Badge>;
}
