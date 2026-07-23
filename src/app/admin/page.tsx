import { getSession } from "@/lib/session";
import {
  FinanceDashboardView, SupportDashboardView,
  AccountManagerDashboardView, FullAdminDashboard,
} from "./DashboardViews";
import {
  fetchFinanceDashboardData, fetchSupportDashboardData,
  fetchAccountManagerDashboardData, fetchFullAdminDashboardData,
} from "./actions";

export default async function AdminDashboardPage() {
  const session = await getSession();

  const adminRoles = ["ADMIN", "SUPER_ADMIN"] as const;
  const isFullAdmin = session?.roles.some((r) => adminRoles.includes(r as typeof adminRoles[number]));

  const isFinanceOnly =
    session?.roles.includes("FINANCE") && !isFullAdmin;

  const isSupportOnly =
    session?.roles.includes("SUPPORT") && !isFullAdmin && !session.roles.includes("FINANCE");

  const isAccountManagerOnly =
    session?.roles.includes("ACCOUNT_MANAGER") &&
    !isFullAdmin &&
    !session.roles.includes("FINANCE") &&
    !session.roles.includes("SUPPORT");

  if (isFinanceOnly) {
    const initialData = await fetchFinanceDashboardData();
    return <FinanceDashboardView initialData={initialData} />;
  }

  if (isSupportOnly) {
    const initialData = await fetchSupportDashboardData(session?.userId);
    return <SupportDashboardView initialData={initialData} currentUserId={session?.userId} />;
  }

  if (isAccountManagerOnly) {
    const initialData = await fetchAccountManagerDashboardData();
    return <AccountManagerDashboardView initialData={initialData} />;
  }

  const isSuperAdmin = session?.roles.includes("SUPER_ADMIN") ?? false;
  const canViewFinance = isSuperAdmin || (session?.roles.includes("FINANCE") ?? false);
  const initialData = await fetchFullAdminDashboardData(canViewFinance);
  return <FullAdminDashboard initialData={initialData} canViewFinance={canViewFinance} isSuperAdmin={isSuperAdmin} />;
}
