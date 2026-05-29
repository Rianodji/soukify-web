"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage, markConversationRead } from "../../actions";
import { useEffect } from "react";

interface MessageInputProps {
  conversationId: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageInput({ conversationId, bottomRef }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Mark as read on mount
    startTransition(() => markConversationRead(conversationId));
    // Scroll to bottom
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const msg = content.trim();
    setContent("");
    startTransition(async () => {
      await sendMessage(conversationId, msg);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-border bg-white">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Écrire un message… (Entrée pour envoyer)"
        className="flex-1 resize-none rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand transition-colors max-h-32 overflow-y-auto"
        style={{ minHeight: "44px" }}
      />
      <button
        type="submit"
        disabled={pending || !content.trim()}
        className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
