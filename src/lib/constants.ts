export const CATEGORIES = [
  { id: "phones",      name: "Téléphones",     icon: "📱", color: "bg-blue-50   text-blue-600",   count: null },
  { id: "electronics", name: "Électronique",   icon: "💻", color: "bg-purple-50 text-purple-600", count: null },
  { id: "fashion",     name: "Mode",           icon: "👗", color: "bg-pink-50   text-pink-600",   count: null },
  { id: "vehicles",    name: "Véhicules",      icon: "🚗", color: "bg-red-50    text-red-600",    count: null },
  { id: "realestate",  name: "Immobilier",     icon: "🏠", color: "bg-amber-50  text-amber-600",  count: null },
  { id: "home",        name: "Maison",         icon: "🛋️", color: "bg-green-50  text-green-600",  count: null },
  { id: "services",    name: "Services",       icon: "🔧", color: "bg-teal-50   text-teal-600",   count: null },
  { id: "food",        name: "Alimentation",   icon: "🌾", color: "bg-yellow-50 text-yellow-600", count: null },
] as const;

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
