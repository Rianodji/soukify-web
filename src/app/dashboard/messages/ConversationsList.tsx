"use client";

import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { fetchMyConversations, type DashboardConversation } from "../actions";
import { usePolledData } from "@/hooks/usePolledData";

interface ConversationsListProps {
  initialData: DashboardConversation[];
  currentUserId?: string;
}

export function ConversationsList({ initialData, currentUserId }: ConversationsListProps) {
  const { data } = usePolledData("my-conversations", fetchMyConversations, initialData);
  const conversations = data ?? [];

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
        <MessageSquare className="w-12 h-12 text-border" />
        <p className="text-text-secondary">Aucun message pour le moment.</p>
        <Link href="/" className="text-sm text-brand hover:underline flex items-center gap-1">
          Contacter un vendeur <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
      {conversations.map((conv) => {
        const iAmBuyer = conv.buyerId === currentUserId;
        const label = iAmBuyer ? "Vendeur" : "Acheteur";
        return (
          <Link
            key={conv.id}
            href={`/dashboard/messages/${conv.id}`}
            className="flex items-center gap-3 px-4 py-4 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
              {label[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${conv.unreadCount > 0 ? "text-text-primary" : "text-text-secondary"}`}>
                  Conversation avec le {label.toLowerCase()}
                </p>
                {conv.lastMessageAt && (
                  <span className="text-xs text-text-disabled shrink-0">
                    {new Date(conv.lastMessageAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate mt-0.5">À propos d&apos;une annonce</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                {conv.unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
