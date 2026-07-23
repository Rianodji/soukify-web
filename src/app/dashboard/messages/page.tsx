import { serverGet } from "@/infrastructure/http/ApiServer";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PaginatedResponse } from "@/types/api";

interface Conversation {
  id: string;
  otherUser: { id: string; name: string; avatarUrl?: string };
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
}

export default async function MessagesPage() {
  let conversations: Conversation[] = [];

  try {
    const res = await serverGet<PaginatedResponse<Conversation>>("/conversations?limit=20", 0);
    conversations = res.data;
  } catch {
    /* handled below */
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-text-primary">Messages</h2>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <MessageSquare className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucun message pour le moment.</p>
          <Link href="/" className="text-sm text-brand hover:underline flex items-center gap-1">
            Contacter un vendeur <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/messages/${conv.id}`}
              className="flex items-center gap-3 px-4 py-4 hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                {conv.otherUser.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${conv.unreadCount > 0 ? "text-text-primary" : "text-text-secondary"}`}>
                    {conv.otherUser.name}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-xs text-text-disabled shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-text-secondary truncate mt-0.5">{conv.lastMessage.content}</p>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
