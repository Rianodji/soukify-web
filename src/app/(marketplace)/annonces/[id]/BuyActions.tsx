"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MessageSquare, ShoppingBag, Phone } from "lucide-react";

interface BuyActionsProps {
  annonceId: string;
  sellerId: string;
  sellerPhone: string;
  isAuthenticated: boolean;
  isSeller: boolean;
}

export function BuyActions({ annonceId, sellerId, sellerPhone, isAuthenticated, isSeller }: BuyActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function requireAuth(redirectPath: string) {
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  async function handleContact() {
    if (!isAuthenticated) {
      requireAuth(`/annonces/${annonceId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellerId }),
          credentials: "include",
        });
        if (res.ok) {
          const body = await res.json() as { data: { id: string } };
          router.push(`/dashboard/messages?conversation=${body.data.id}`);
        } else {
          router.push("/dashboard/messages");
        }
      } catch {
        router.push("/dashboard/messages");
      }
    });
  }

  async function handleBuy() {
    if (!isAuthenticated) {
      requireAuth(`/annonces/${annonceId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1"}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ annonceId }),
          credentials: "include",
        });
        if (res.ok) {
          const body = await res.json() as { data: { id: string } };
          router.push(`/dashboard/orders/${body.data.id}`);
        } else {
          const body = await res.json() as { message?: string };
          setError(body.message ?? "Une erreur est survenue.");
        }
      } catch {
        setError("Impossible de créer la commande. Réessayez.");
      }
    });
  }

  if (isSeller) {
    return (
      <p className="text-sm text-text-secondary text-center py-3">
        C&apos;est votre annonce.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-error bg-error-light rounded-xl px-4 py-2.5">{error}</p>
      )}

      <Button
        size="lg"
        variant="gold"
        className="w-full"
        onClick={handleBuy}
      >
        <ShoppingBag className="w-5 h-5" />
        Acheter maintenant
      </Button>

      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        onClick={handleContact}
      >
        <MessageSquare className="w-5 h-5" />
        Contacter le vendeur
      </Button>

      <a
        href={`tel:${sellerPhone}`}
        className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-border text-text-secondary hover:border-brand hover:text-brand transition-colors text-sm font-medium"
      >
        <Phone className="w-4 h-4" />
        Appeler
      </a>
    </div>
  );
}
