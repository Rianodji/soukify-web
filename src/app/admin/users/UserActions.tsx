"use client";

import { useTransition, useState } from "react";
import { approveKyc, rejectKyc, suspendUser, unsuspendUser, changeUserRole } from "../actions";
import { Button } from "@/components/ui/Button";
import type { KycStatus, UserRole } from "@/types/api";

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

interface UserActionsProps {
  userId: string;
  isSuspended: boolean;
  kycStatus: KycStatus;
  primaryRole: UserRole;
}

export function UserActions({ userId, isSuspended, kycStatus, primaryRole }: UserActionsProps) {
  const [pending, startTransition] = useTransition();
  const [showRoleChange, setShowRoleChange] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* KYC */}
        {kycStatus === "PENDING" && (
          <>
            <Button size="sm" variant="secondary" loading={pending}
              onClick={() => startTransition(() => approveKyc(userId))}
              className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
              ✓ KYC
            </Button>
            <Button size="sm" variant="secondary" loading={pending}
              onClick={() => startTransition(() => rejectKyc(userId))}
              className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
              ✗ KYC
            </Button>
          </>
        )}

        {/* Suspend */}
        {isSuspended ? (
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => startTransition(() => unsuspendUser(userId))}
            className="text-success border-success hover:bg-success-light text-xs h-7 px-2">
            Réactiver
          </Button>
        ) : (
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => startTransition(() => suspendUser(userId))}
            className="text-error border-error hover:bg-error-light text-xs h-7 px-2">
            Suspendre
          </Button>
        )}

        {/* Role change toggle */}
        <Button size="sm" variant="ghost"
          onClick={() => setShowRoleChange((v) => !v)}
          className="text-xs h-7 px-2 text-text-secondary">
          Rôle ▾
        </Button>
      </div>

      {/* Inline role selector */}
      {showRoleChange && (
        <select
          defaultValue={primaryRole}
          onChange={(e) => {
            startTransition(() => changeUserRole(userId, e.target.value as UserRole));
            setShowRoleChange(false);
          }}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white text-text-primary focus:outline-none focus:border-brand w-full max-w-[160px]"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
