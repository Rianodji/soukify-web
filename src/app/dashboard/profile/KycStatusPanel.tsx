"use client";

import { CheckCircle, Clock, Shield } from "lucide-react";
import { usePolledData } from "@/hooks/usePolledData";
import { fetchMyProfile } from "../actions";
import { KycForm } from "./KycForm";
import { KycDocumentViewer } from "@/components/features/kyc/KycDocumentViewer";
import type { MyProfile } from "@/types/api";

export function KycStatusPanel({ initialProfile }: { initialProfile: MyProfile | null }) {
  const { data } = usePolledData("my-profile", fetchMyProfile, initialProfile);
  const kycStatus = data?.kycStatus ?? "NOT_SUBMITTED";

  if (kycStatus === "APPROVED") {
    return (
      <div className="p-5 rounded-2xl bg-success-light border border-success space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Identité vérifiée</p>
            <p className="text-xs text-text-secondary mt-0.5">Votre identité a été vérifiée. Cela renforce la confiance avec les autres utilisateurs.</p>
          </div>
        </div>
        <KycDocumentViewer src="/api/kyc-document" alt="Votre document soumis" />
      </div>
    );
  }

  if (kycStatus === "PENDING") {
    return (
      <div className="p-5 rounded-2xl bg-warning-light border border-warning space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Vérification en cours</p>
            <p className="text-xs text-text-secondary mt-0.5">Votre document est en cours d&apos;examen. Comptez 24 à 48h.</p>
          </div>
        </div>
        <KycDocumentViewer src="/api/kyc-document" alt="Votre document soumis" />
      </div>
    );
  }

  const isErrorState = kycStatus === "REJECTED" || kycStatus === "EXPIRED";

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-4 border-b border-border ${isErrorState ? "bg-error-light" : "bg-warning-light"}`}>
        <Shield className={`w-4 h-4 ${isErrorState ? "text-error" : "text-warning"}`} />
        <h3 className="font-semibold text-text-primary text-sm">
          {kycStatus === "REJECTED" ? "Vérification rejetée — resoumettre"
            : kycStatus === "EXPIRED" ? "Document expiré — resoumettre"
            : "Vérifiez votre identité (KYC)"}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {isErrorState && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Document précédemment soumis</p>
            <KycDocumentViewer src="/api/kyc-document" alt="Votre document précédemment soumis" />
          </div>
        )}
        <p className="text-sm text-text-secondary leading-relaxed">
          La vérification KYC est <strong>gratuite</strong>, prend 2 minutes, et débloque le badge de confiance sur vos annonces.
        </p>
        <ul className="text-sm text-text-secondary space-y-1.5">
          {["Carte nationale d'identité ou passeport", "Photo nette et lisible"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-brand text-xs flex items-center justify-center font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <KycForm />
      </div>
    </div>
  );
}
