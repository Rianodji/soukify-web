import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, Shield } from "lucide-react";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { ChatClient } from "./ChatClient";
import type { Message, Conversation, PaginatedResponse } from "@/types/api";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;

  const [session, conv, messagesRes] = await Promise.all([
    getSession(),
    serverGet<Conversation>(`/conversations/${id}`, 0).catch(() => null),
    serverGet<PaginatedResponse<Message>>(`/conversations/${id}/messages?limit=50`, 0).catch(() => null),
  ]);

  if (!conv) notFound();
  if (!session) notFound();

  const messages = messagesRes?.items ?? [];
  const otherUser = conv.participants.find((p) => p.id !== session.userId) ?? conv.participants[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
        <Link href="/dashboard/messages"
          className="text-text-secondary hover:text-brand transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {otherUser && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
              {otherUser.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{otherUser.name}</p>
              {otherUser.isKycVerified && (
                <p className="text-xs text-success flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Vérifié
                </p>
              )}
            </div>
          </div>
        )}

        {conv.annonce && (
          <Link href={`/annonces/${conv.annonce.id}`} target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-brand transition-colors shrink-0 max-w-[200px]">
            {conv.annonce.images?.[0]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={conv.annonce.images[0]} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              : <Package className="w-4 h-4 text-text-disabled shrink-0" />
            }
            <span className="text-xs text-text-secondary truncate hidden sm:block">
              {conv.annonce.title}
            </span>
          </Link>
        )}
      </div>

      {/* Chat body */}
      <ChatClient
        conversationId={id}
        initialMessages={messages}
        currentUserId={session.userId}
      />
    </div>
  );
}
