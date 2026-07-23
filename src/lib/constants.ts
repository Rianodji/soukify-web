/**
 * Purely cosmetic icon/color per category `slug` — `GET /categories` never
 * seeds a real `icon` (always `null`), so this fills the visual gap without
 * faking data. Keyed by slug (stable), not id. Falls back to
 * `DEFAULT_CATEGORY_STYLE` for any slug not listed here.
 */
export const CATEGORY_STYLE: Record<string, { icon: string; color: string }> = {
  telephones:   { icon: "📱", color: "bg-blue-50   text-blue-600" },
  informatique: { icon: "💻", color: "bg-purple-50 text-purple-600" },
  electronique: { icon: "📺", color: "bg-indigo-50 text-indigo-600" },
  vehicules:    { icon: "🚗", color: "bg-red-50    text-red-600" },
  immobilier:   { icon: "🏠", color: "bg-amber-50  text-amber-600" },
  mode:         { icon: "👗", color: "bg-pink-50   text-pink-600" },
  maison:       { icon: "🛋️", color: "bg-green-50  text-green-600" },
  agriculture:  { icon: "🌾", color: "bg-lime-50   text-lime-700" },
  services:     { icon: "🔧", color: "bg-teal-50   text-teal-600" },
  sport:        { icon: "⚽", color: "bg-orange-50 text-orange-600" },
  alimentation: { icon: "🍚", color: "bg-yellow-50 text-yellow-600" },
  materiaux:    { icon: "🧱", color: "bg-stone-50  text-stone-600" },
};

export const DEFAULT_CATEGORY_STYLE = { icon: "🏷️", color: "bg-gray-50 text-gray-600" };

export const CHAD_CITIES = [
  "N'Djamena", "Moundou", "Sarh", "Abéché", "Kélo",
  "Doba", "Bongor", "Mongo", "Ati", "Am Timan",
];

export const ANNONCE_CONDITIONS: Record<string, string> = {
  NEW:      "Neuf",
  LIKE_NEW: "Comme neuf",
  GOOD:     "Bon état",
  FAIR:     "État correct",
  POOR:     "À réparer",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID:            "Payé",
  CONFIRMED:       "Confirmé",
  IN_DELIVERY:     "En livraison",
  COMPLETED:       "Complété",
  CANCELLED:       "Annulé",
  DISPUTED:        "En litige",
};
