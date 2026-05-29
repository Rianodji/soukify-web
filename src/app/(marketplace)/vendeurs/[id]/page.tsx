import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Shield, Star, Calendar, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPhoneDisplay } from "@/lib/utils";
import { AnnonceCard } from "@/components/features/annonces/AnnonceCard";
import type { UserProfile, Annonce, PaginatedResponse, Review, UserScore } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const body = await res.json() as { data: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

interface VendeurPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendeurPage({ params }: VendeurPageProps) {
  const { id } = await params;

  const [profile, annoncesRes, reviews, score] = await Promise.all([
    fetchJson<UserProfile>(`${API_BASE}/users/${id}/profile`),
    fetchJson<PaginatedResponse<Annonce>>(`${API_BASE}/search/annonces?sellerId=${id}&status=ACTIVE&limit=12`),
    fetchJson<Review[]>(`${API_BASE}/users/${id}/reviews`),
    fetchJson<UserScore>(`${API_BASE}/users/${id}/score`),
  ]);

  if (!profile) notFound();

  const annonces = annoncesRes?.items ?? [];
  const totalAnnonces = annoncesRes?.total ?? 0;

  const memberSince = new Date(profile.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  function StarRating({ rating }: { rating: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? "text-gold fill-gold" : "text-border"}`}
            fill={i < Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {profile.name[0].toUpperCase()}
            </div>
            {profile.isKycVerified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-success border-2 border-white flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-bold text-text-primary">{profile.name}</h1>
                <p className="text-sm text-text-secondary">{formatPhoneDisplay(profile.phoneNumber)}</p>
              </div>
              {profile.isKycVerified && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Identité vérifiée
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              {score && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={score.score / 20} />
                  <span className="text-text-secondary text-xs">
                    {score.reviewCount} avis
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Package className="w-4 h-4 text-brand" />
                <span>{totalAnnonces} annonce{totalAnnonces !== 1 ? "s" : ""} active{totalAnnonces !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>Membre depuis {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Annonces */}
        <div className="space-y-4">
          <h2 className="font-bold text-text-primary text-lg">
            Annonces actives
            {totalAnnonces > 0 && (
              <span className="ml-2 text-sm font-normal text-text-secondary">({totalAnnonces})</span>
            )}
          </h2>

          {annonces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-border">
              <Package className="w-10 h-10 text-border" />
              <p className="text-text-secondary text-sm">Aucune annonce active pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <h2 className="font-bold text-text-primary text-lg">Avis</h2>

          {!reviews || reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 bg-white rounded-2xl border border-border">
              <Star className="w-8 h-8 text-border" />
              <p className="text-text-secondary text-sm text-center">
                Aucun avis pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                        {review.reviewer.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{review.reviewer.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? "text-gold" : "text-border"}`}
                          fill={i < review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-xs text-text-disabled">
                    {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
