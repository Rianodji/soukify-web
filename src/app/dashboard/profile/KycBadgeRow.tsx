"use client";

import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { usePolledData } from "@/hooks/usePolledData";
import { fetchMyProfile } from "../actions";
import type { MyProfile } from "@/types/api";

export function KycBadgeRow({ initialProfile }: { initialProfile: MyProfile | null }) {
  const { data } = usePolledData("my-profile", fetchMyProfile, initialProfile);
  const kycStatus = data?.kycStatus ?? "NOT_SUBMITTED";

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <Shield className="w-4 h-4 text-text-disabled shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-text-secondary">Vérification KYC</p>
        <div className="flex items-center gap-2 mt-0.5">
          {kycStatus === "APPROVED" && (
            <><CheckCircle className="w-4 h-4 text-success" /><span className="text-sm font-medium text-success">Identité vérifiée</span></>
          )}
          {kycStatus === "PENDING" && (
            <><Clock className="w-4 h-4 text-warning" /><span className="text-sm font-medium text-warning">En cours d&apos;examen</span></>
          )}
          {kycStatus === "REJECTED" && (
            <><AlertCircle className="w-4 h-4 text-error" /><span className="text-sm font-medium text-error">Rejetée</span></>
          )}
          {kycStatus === "EXPIRED" && (
            <><AlertCircle className="w-4 h-4 text-error" /><span className="text-sm font-medium text-error">Expirée</span></>
          )}
          {kycStatus === "NOT_SUBMITTED" && (
            <><Clock className="w-4 h-4 text-warning" /><span className="text-sm font-medium text-warning">Non vérifié</span></>
          )}
        </div>
      </div>
    </div>
  );
}
