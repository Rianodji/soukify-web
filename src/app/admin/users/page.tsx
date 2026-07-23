import { Suspense } from "react";
import Link from "next/link";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { formatPhoneDisplay } from "@/lib/utils";
import { Users, ExternalLink } from "lucide-react";
import { UserActions } from "./UserActions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { AdminUser, PaginatedResponse, UserRole, KycStatus } from "@/types/api";

const KYC_CONFIG: Record<KycStatus, { label: string; variant: "success" | "warning" | "error" | "neutral" }> = {
  APPROVED: { label: "KYC ✓",    variant: "success" },
  PENDING:  { label: "KYC…",     variant: "warning" },
  REJECTED: { label: "KYC ✗",    variant: "error" },
  NONE:     { label: "Non vérifié", variant: "neutral" },
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Acheteur", SELLER: "Vendeur", PRO_SELLER: "Pro",
  ADMIN: "Admin", ACCOUNT_MANAGER: "AM", SUPPORT: "Support",
  FINANCE: "Finance", SUPER_ADMIN: "SuperAdmin",
};

const LIMIT = 25;

interface UsersPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * LIMIT;

  const qs = new URLSearchParams();
  qs.set("limit", String(LIMIT));
  qs.set("offset", String(offset));
  if (sp.q)         qs.set("q", sp.q);
  if (sp.role)      qs.set("role", sp.role);
  if (sp.kycStatus) qs.set("kycStatus", sp.kycStatus);
  if (sp.suspended) qs.set("isSuspended", sp.suspended);

  let users: AdminUser[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<AdminUser>>(`/admin/users?${qs}`, 0);
    users = res.items;
    total = res.total;
  } catch { /* handled below */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Utilisateurs</h2>
          <p className="text-sm text-text-secondary mt-0.5">{total.toLocaleString("fr-FR")} compte{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <AdminFilterBar
          searchPlaceholder="Nom ou téléphone…"
          filters={[
            {
              key: "role",
              placeholder: "Tous les rôles",
              options: [
                { value: "BUYER",           label: "Acheteurs" },
                { value: "SELLER",          label: "Vendeurs" },
                { value: "PRO_SELLER",      label: "Vendeurs Pro" },
                { value: "ADMIN",           label: "Admins" },
                { value: "MODERATOR",       label: "Modérateurs" },
                { value: "SUPPORT",         label: "Support" },
                { value: "FINANCE",         label: "Finance" },
                { value: "SUPER_ADMIN",     label: "Super Admins" },
              ],
            },
            {
              key: "kycStatus",
              placeholder: "Tous les KYC",
              options: [
                { value: "PENDING",  label: "KYC en attente" },
                { value: "APPROVED", label: "KYC approuvé" },
                { value: "REJECTED", label: "KYC rejeté" },
                { value: "NONE",     label: "Non soumis" },
              ],
            },
            {
              key: "suspended",
              placeholder: "Tous les statuts",
              options: [
                { value: "false", label: "Actifs" },
                { value: "true",  label: "Suspendus" },
              ],
            },
          ]}
        />
      </Suspense>

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
                  {["Utilisateur", "Téléphone", "Rôles", "KYC", "Statut", "Inscrit le", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const kyc = KYC_CONFIG[user.kycStatus ?? "NONE"];
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
                            {user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-medium text-text-primary group-hover:text-brand transition-colors truncate max-w-[130px] flex items-center gap-1">
                            {user.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs whitespace-nowrap">
                        {formatPhoneDisplay(user.phoneNumber)}
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
                        <Badge variant={user.isSuspended ? "error" : "success"}>
                          {user.isSuspended ? "Suspendu" : "Actif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <UserActions
                          userId={user.id}
                          isSuspended={user.isSuspended}
                          kycStatus={user.kycStatus ?? "NONE"}
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
              <AdminPagination page={page} total={total} limit={LIMIT} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
