import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { getAnnoncePriceXAF, getAnnonceImageUrl } from "@/lib/annonce";
import { ANNONCE_CONDITIONS } from "@/lib/constants";
import type { Annonce } from "@/types/api";

interface AnnonceCardProps {
  annonce: Annonce;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}j`;
}

export function AnnonceCard({ annonce }: AnnonceCardProps) {
  const imageUrl = getAnnonceImageUrl(annonce);
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-border hover:border-brand hover:shadow-lg transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-primary-50 overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={annonce.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-primary-200">
            📦
          </div>
        )}
        {/* Condition badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={annonce.condition === "NEW" ? "success" : "neutral"}>
            {ANNONCE_CONDITIONS[annonce.condition]}
          </Badge>
        </div>
        {/* Type badge */}
        {annonce.type === "SERVICE" && (
          <div className="absolute top-2 right-2">
            <Badge variant="default">Service</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-brand transition-colors">
          {annonce.title}
        </p>

        <p className="text-lg font-bold text-brand mt-auto">
          {formatPrice(getAnnoncePriceXAF(annonce))}
        </p>

        <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {annonce.city}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {timeAgo(annonce.createdAt)}
          </span>
        </div>

        {annonce.seller && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border mt-1">
            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-brand shrink-0">
              {annonce.seller.displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-xs text-text-secondary truncate">{annonce.seller.displayName}</span>
            {annonce.seller.isKYCVerified && (
              <Star className="w-3 h-3 text-gold ml-auto shrink-0" fill="currentColor" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/* Skeleton version for loading state */
export function AnnonceCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-border">
      <div className="aspect-[4/3] bg-border animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-border rounded animate-pulse w-4/5" />
        <div className="h-3 bg-border rounded animate-pulse w-3/5" />
        <div className="h-5 bg-border rounded animate-pulse w-2/5 mt-2" />
        <div className="h-2 bg-border rounded animate-pulse w-full mt-2" />
      </div>
    </div>
  );
}
