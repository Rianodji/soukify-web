"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveKyc, rejectKyc, suspendUser, unsuspendUser, changeUserRole, fetchAdminUserById } from "../../actions";
import { Button } from "@/components/ui/Button";
import { usePolledData } from "@/hooks/usePolledData";
import type { AdminUser, UserRole } from "@/types/api";

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "BUYER",           label: "Acheteur" },
  { value: "SELLER",          label: "Vendeur" },
  { value: "PRO_SELLER",      label: "Vendeur Pro" },
  { value: "SHOP_STAFF",      label: "Staff boutique" },
  { value: "ADMIN",           label: "Administrateur" },
  { value: "MODERATOR",       label: "Modérateur" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "SUPPORT",         label: "Support" },
  { value: "FINANCE",         label: "Finance" },
  { value: "SUPER_ADMIN",     label: "Super Admin" },
];

interface UserProfileActionsProps {
  userId: string;
  initialUser: AdminUser;
}

export function UserProfileActions({ userId, initialUser }: UserProfileActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [documentError, setDocumentError] = useState(false);

  const { data: user } = usePolledData(["admin-user", userId], () => fetchAdminUserById(userId), initialUser);

  const kycStatus = user?.kycStatus ?? "NOT_SUBMITTED";
  const isSuspended = user?.status === "SUSPENDED";
  const primaryRole: UserRole = (
    user?.roles.find((r) => ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT", "ACCOUNT_MANAGER"].includes(r)) ??
    user?.roles.find((r) => ["PRO_SELLER", "SELLER"].includes(r)) ??
    "BUYER"
  );
  const hasSubmittedDocument = kycStatus !== "NOT_SUBMITTED";

  function run(action: () => Promise<void>) {
    startTransition(async () => { await action(); router.refresh(); });
  }

  return (
    <div className="space-y-3">
      {/* KYC */}
      {(kycStatus === "PENDING" || kycStatus === "REJECTED" || kycStatus === "EXPIRED") && hasSubmittedDocument && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Document soumis</p>
          {documentError ? (
            <p className="text-xs text-text-disabled italic">Document indisponible.</p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/admin/kyc-document/${userId}`}
              alt="Document d'identité soumis"
              className="w-full rounded-xl border border-border object-contain max-h-64"
              onError={() => setDocumentError(true)}
            />
          )}
        </div>
      )}

      {kycStatus === "PENDING" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Vérification KYC</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={pending} className="flex-1 text-success border-success hover:bg-success-light"
              onClick={() => run(() => approveKyc(userId))}>
              ✓ Approuver KYC
            </Button>
            <Button size="sm" variant="secondary" loading={pending} className="flex-1 text-error border-error hover:bg-error-light"
              onClick={() => {
                const reason = prompt("Motif du rejet KYC :");
                if (reason?.trim()) run(() => rejectKyc(userId, reason.trim()));
              }}>
              ✗ Rejeter KYC
            </Button>
          </div>
        </div>
      )}
      {kycStatus === "APPROVED" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-light text-success text-sm font-medium">
          <span>✓</span> Identité vérifiée
        </div>
      )}
      {kycStatus === "EXPIRED" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-light text-error text-sm font-medium">
          <span>!</span> Document expiré
        </div>
      )}

      {/* Suspension */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Accès</p>
        {isSuspended ? (
          <Button size="md" variant="secondary" loading={pending} className="w-full text-success border-success hover:bg-success-light"
            onClick={() => run(() => unsuspendUser(userId))}>
            Réactiver le compte
          </Button>
        ) : (
          <Button size="md" variant="secondary" loading={pending} className="w-full text-error border-error hover:bg-error-light"
            onClick={() => { if (confirm("Suspendre ce compte ?")) run(() => suspendUser(userId)); }}>
            Suspendre le compte
          </Button>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rôle</p>
        <Button size="sm" variant="ghost" className="w-full text-text-secondary text-xs"
          onClick={() => setShowRoleChange((v) => !v)}>
          Changer le rôle ▾
        </Button>
        {showRoleChange && (
          <select
            defaultValue={primaryRole}
            onChange={(e) => {
              run(() => changeUserRole(userId, e.target.value as UserRole));
              setShowRoleChange(false);
            }}
            className="w-full h-10 px-3 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-brand"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
