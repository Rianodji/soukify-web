import { unstable_rethrow } from "next/navigation";
import { OrdersList } from "./OrdersList";
import { fetchMyOrders } from "../actions";
import type { Order, PaginatedResponse } from "@/types/api";

export default async function OrdersPage() {
  let initialData: PaginatedResponse<Order> = { items: [], total: 0 };
  try {
    initialData = await fetchMyOrders("limit=20");
  } catch (e) { unstable_rethrow(e); /* OrdersList handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <OrdersList initialData={initialData} />
    </div>
  );
}
