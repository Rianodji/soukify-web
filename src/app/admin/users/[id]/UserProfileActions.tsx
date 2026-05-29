"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveKyc, rejectKyc, suspendUser, unsuspendUser, changeUserRole } from "../../actions";
import { Button } from "@/components/ui/Button";
import type { KycStatus, UserRole } from "@/types/api";

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "BUYER",           label: "Acheteur" },
  { value: "SELLER",          label: "Vendeur" },
  { value: "PRO",             label: "Vendeur Pro" },
  { value: "ADMIN",           label: "Administrateur" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "SUPPORT",         label: "Support" },
  { value: "FINANCE",         label: "Finance" },
  { value: "SUPER_ADMIN",     label: "Super Admin" },
];

interface UserProfileActionsProps {
  userId: string;
  kycStatus: KycStatus;
  isSuspended: boolean;
  primaryRole: UserRole;
}

export function UserProfileActions({ userId, kycStatus, isSuspended, primaryRole }: UserProfileActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRoleChange, setShowRoleChange] = useState(false);

  function run(action: () => Promise<void>) {
    startTransition(async () => { await action(); router.refresh(); });
  }

  return (
    <div className="space-y-3">
      {/* KYC */}
      {kycStatus === "PENDING" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Vérification KYC</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={pending} className="flex-1 text-success border-success hover:bg-success-light"
              onClick={() => run(() => approveKyc(userId))}>
              ✓ Approuver KYC
            </Button>
            <Button size="sm" variant="secondary" loading={pending} className="flex-1 text-error border-error hover:bg-error-light"
              onClick={() => { if (confirm("Rejeter le KYC ?")) run(() => rejectKyc(userId)); }}>
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
