import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { UsersTable } from "./UsersTable";
import { fetchAdminUsers } from "../actions";
import type { AdminUser, PaginatedResponse } from "@/types/api";

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
  if (sp.suspended) qs.set("status", sp.suspended === "true" ? "SUSPENDED" : "ACTIVE");

  const qsString = qs.toString();

  let initialData: PaginatedResponse<AdminUser> = { items: [], total: 0 };
  try {
    initialData = await fetchAdminUsers(qsString);
  } catch (e) { unstable_rethrow(e); /* UsersTable handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Utilisateurs</h2>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <AdminFilterBar
          searchPlaceholder="Nom, téléphone ou email…"
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
                { value: "NOT_SUBMITTED", label: "Non soumis" },
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

      <UsersTable qs={qsString} page={page} limit={LIMIT} initialData={initialData} />
    </div>
  );
}
