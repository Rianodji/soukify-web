import { unstable_rethrow } from "next/navigation";
import { getSession, isSeller, isAdmin } from "@/lib/session";
import { DashboardOverview } from "./DashboardOverview";
import { fetchDashboardOverview, type DashboardOverviewData } from "./actions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const sellerMode = isSeller(session);
  const adminMode  = isAdmin(session);
  const isPro      = session.roles.includes("PRO_SELLER");

  let initialData: DashboardOverviewData = {
    recentOrders: [], totalOrders: 0, activeAnnonces: [], totalAnnonces: 0, proShop: null,
  };
  try {
    initialData = await fetchDashboardOverview(sellerMode, isPro);
  } catch (e) { unstable_rethrow(e); /* DashboardOverview handles the empty state */ }

  return (
    <DashboardOverview
      initialData={initialData}
      sellerMode={sellerMode}
      adminMode={adminMode}
      isPro={isPro}
    />
  );
}
