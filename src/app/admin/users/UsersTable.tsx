"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPhoneDisplay } from "@/lib/utils";
import { Users, ExternalLink } from "lucide-react";
import { UserActions } from "./UserActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { fetchAdminUsers } from "../actions";
import { usePolledData } from "@/hooks/usePolledData";
import type { AdminUser, PaginatedResponse, UserRole, KycStatus } from "@/types/api";

const KYC_CONFIG: Record<KycStatus, { label: string; variant: "success" | "warning" | "error" | "neutral" }> = {
  APPROVED:      { label: "KYC ✓",       variant: "success" },
  PENDING:       { label: "KYC…",        variant: "warning" },
  REJECTED:      { label: "KYC ✗",       variant: "error" },
  EXPIRED:       { label: "KYC expiré",  variant: "error" },
  NOT_SUBMITTED: { label: "Non vérifié", variant: "neutral" },
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Acheteur", SELLER: "Vendeur", PRO_SELLER: "Pro",
  ADMIN: "Admin", ACCOUNT_MANAGER: "AM", SUPPORT: "Support",
  FINANCE: "Finance", SUPER_ADMIN: "SuperAdmin",
};

interface UsersTableProps {
  qs: string;
  page: number;
  limit: number;
  initialData: PaginatedResponse<AdminUser>;
}

export function UsersTable({ qs, page, limit, initialData }: UsersTableProps) {
  const { data } = usePolledData(
    ["admin-users", qs],
    () => fetchAdminUsers(qs),
    initialData,
  );

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <p className="text-sm text-text-secondary -mt-2">{total.toLocaleString("fr-FR")} compte{total !== 1 ? "s" : ""}</p>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <Users className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Utilisateur", "Contact", "Rôles", "KYC", "Statut", "Inscrit le", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const kyc = KYC_CONFIG[user.kycStatus ?? "NOT_SUBMITTED"];
                  const isSuspended = user.status === "SUSPENDED";
                  const primaryRole: UserRole = (
                    user.roles.find((r) => ["SUPER_ADMIN","ADMIN","FINANCE","SUPPORT","ACCOUNT_MANAGER"].includes(r)) ??
                    user.roles.find((r) => ["PRO_SELLER","SELLER"].includes(r)) ??
                    "BUYER"
                  );
                  return (
                    <tr key={user.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2.5 group">
                          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.displayName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-medium text-text-primary group-hover:text-brand transition-colors truncate max-w-[130px] flex items-center gap-1">
                            {user.displayName}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap max-w-[160px] truncate">
                        {user.phoneNumber
                          ? <span className="font-mono">{formatPhoneDisplay(user.phoneNumber)}</span>
                          : (user.email ?? "—")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge key={r} variant="default" className="text-[10px] px-1.5 py-0">
                              {ROLE_LABELS[r] ?? r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={kyc.variant}>{kyc.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isSuspended ? "error" : "success"}>
                          {isSuspended ? "Suspendu" : "Actif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <UserActions
                          userId={user.id}
                          isSuspended={isSuspended}
                          kycStatus={user.kycStatus ?? "NOT_SUBMITTED"}
                          primaryRole={primaryRole}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 border-t border-border">
            <Suspense fallback={null}>
              <AdminPagination page={page} total={total} limit={limit} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
