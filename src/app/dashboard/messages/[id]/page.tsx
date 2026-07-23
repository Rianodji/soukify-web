import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { ChatClient } from "./ChatClient";
import type { Message, Conversation } from "@/types/api";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;

  const [session, conv, messagesRes] = await Promise.all([
    getSession(),
    serverGet<Conversation>(`/conversations/${id}`, 0).catch(() => null),
    serverGet<{ messages: Message[]; total: number }>(`/conversations/${id}/messages?limit=50`, 0).catch(() => null),
  ]);

  if (!conv) notFound();
  if (!session) notFound();

  const messages = messagesRes?.messages ?? [];
  const otherPartyLabel = conv.buyerId === session.userId ? "Vendeur" : "Acheteur";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
        <Link href="/dashboard/messages"
          className="text-text-secondary hover:text-brand transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
            {otherPartyLabel[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{otherPartyLabel}</p>
          </div>
        </div>

        <Link href={`/annonces/${conv.annonceId}`} target="_blank"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-brand transition-colors shrink-0 text-xs text-text-secondary">
          Voir l&apos;annonce
        </Link>
      </div>

      {/* Chat body */}
      <ChatClient
        conversationId={id}
        initialMessages={messages}
        currentUserId={session.userId}
        otherPartyLabel={otherPartyLabel}
      />
    </div>
  );
}
