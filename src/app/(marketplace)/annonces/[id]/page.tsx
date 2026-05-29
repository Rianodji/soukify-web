import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Clock, Shield, Star, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { ANNONCE_CONDITIONS } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { ImageGallery } from "./ImageGallery";
import { BuyActions } from "./BuyActions";
import type { Annonce } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

async function getAnnonce(id: string): Promise<Annonce | null> {
  try {
    const res = await fetch(`${API_BASE}/annonces/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json() as { data: Annonce };
    return body.data ?? null;
  } catch {
    return null;
  }
}

interface AnnoncePageProps {
  params: Promise<{ id: string }>;
}

export default async function AnnoncePage({ params }: AnnoncePageProps) {
  const { id } = await params;
  const [annonce, session] = await Promise.all([
    getAnnonce(id),
    getSession(),
  ]);

  if (!annonce) notFound();

  const isAuthenticated = !!session;
  const isSeller = session?.userId === annonce.seller.id;

  const conditionConfig: Record<string, { variant: "success" | "default" | "warning" | "neutral" | "error" }> = {
    NEW:      { variant: "success" },
    LIKE_NEW: { variant: "default" },
    GOOD:     { variant: "default" },
    FAIR:     { variant: "warning" },
    POOR:     { variant: "neutral" },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour aux annonces
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Gallery */}
          <ImageGallery images={annonce.images} title={annonce.title} />

          {/* Description */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-text-primary">Description</h2>
            {annonce.description ? (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {annonce.description}
              </p>
            ) : (
              <p className="text-sm text-text-disabled italic">Aucune description fournie.</p>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Détails</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Type",      value: annonce.type === "SALE" ? "Vente" : "Service" },
                { label: "État",      value: ANNONCE_CONDITIONS[annonce.condition] ?? annonce.condition },
                { label: "Ville",     value: annonce.city },
                { label: "Publié",    value: timeAgo(annonce.createdAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-text-disabled text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="font-medium text-text-primary mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right column — sticky panel */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 lg:sticky lg:top-24">
            {/* Title & price */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant={(conditionConfig[annonce.condition]?.variant) ?? "neutral"}>
                  {ANNONCE_CONDITIONS[annonce.condition]}
                </Badge>
                {annonce.type === "SERVICE" && (
                  <Badge variant="default">Service</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-text-primary leading-snug">
                {annonce.title}
              </h1>
              <p className="text-3xl font-bold text-brand">
                {formatPrice(annonce.price)}
              </p>
            </div>

            {/* Location & time */}
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                {annonce.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(annonce.createdAt)}
              </span>
            </div>

            <div className="h-px bg-border" />

            {/* Seller */}
            <Link
              href={`/vendeurs/${annonce.seller.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                {annonce.seller.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm group-hover:text-brand transition-colors">
                  {annonce.seller.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {annonce.seller.isKycVerified && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Shield className="w-3 h-3" />
                      Identité vérifiée
                    </span>
                  )}
                  {!annonce.seller.isKycVerified && (
                    <span className="text-xs text-text-disabled">Vendeur particulier</span>
                  )}
                </div>
              </div>
              <Star className="w-4 h-4 text-gold" />
            </Link>

            <div className="h-px bg-border" />

            {/* CTA */}
            <BuyActions
              annonceId={annonce.id}
              sellerId={annonce.seller.id}
              sellerPhone={annonce.seller.phoneNumber}
              isAuthenticated={isAuthenticated}
              isSeller={isSeller}
            />

            {/* Trust badge */}
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-primary-50 border border-primary-100">
              <Shield className="w-4 h-4 text-brand shrink-0" />
              <p className="text-xs text-text-secondary">
                Paiement sécurisé par <span className="font-semibold text-brand">Mobile Money</span> via escrow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
