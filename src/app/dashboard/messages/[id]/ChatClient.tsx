"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage, markConversationRead } from "../../actions";
import type { Message } from "@/types/api";

interface ChatClientProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherPartyLabel: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return `Hier ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function ChatClient({ conversationId, initialMessages, currentUserId, otherPartyLabel }: ChatClientProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
    startTransition(() => { void markConversationRead(conversationId); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const msg = content.trim();
    setContent("");
    startTransition(async () => {
      await sendMessage(conversationId, msg);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {initialMessages.length === 0 && (
          <div className="flex items-center justify-center py-16 text-sm text-text-disabled">
            Commencez la conversation
          </div>
        )}

        {initialMessages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          const prevMsg = initialMessages[i - 1];
          const showDayDivider = !prevMsg ||
            new Date(msg.sentAt).toDateString() !== new Date(prevMsg.sentAt).toDateString();

          return (
            <div key={msg.id}>
              {showDayDivider && i > 0 && (
                <div className="flex items-center justify-center py-2">
                  <span className="text-xs text-text-disabled">
                    {new Date(msg.sentAt).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}
                  </span>
                </div>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-[10px] text-text-disabled px-1 mb-0.5">{otherPartyLabel}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isMe
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-white border border-border text-text-primary rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-text-disabled px-1 mt-0.5">{formatTime(msg.sentAt)}</p>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3 border-t border-border bg-white shrink-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
          }}
          rows={1}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          className="flex-1 resize-none rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand transition-colors"
          style={{ maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
