import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { ConversationsList } from "./ConversationsList";
import { fetchMyConversations, type DashboardConversation } from "../actions";

export default async function MessagesPage() {
  const session = await getSession();

  let initialData: DashboardConversation[] = [];
  try {
    initialData = await fetchMyConversations();
  } catch (e) { unstable_rethrow(e); /* ConversationsList handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-text-primary">Messages</h2>
      <ConversationsList initialData={initialData} currentUserId={session?.userId} />
    </div>
  );
}
