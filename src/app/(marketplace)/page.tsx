import Link from "next/link";
import { ArrowRight, Shield, Smartphone, CheckCircle, TrendingUp, Tag } from "lucide-react";
import { SearchBar } from "@/components/features/search/SearchBar";
import { AnnonceCard, AnnonceCardSkeleton } from "@/components/features/annonces/AnnonceCard";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/constants";
import type { Annonce, SearchPaginatedResponse } from "@/types/api";

/* ── Server-side data fetching ───────────────────────────── */
async function getRecentAnnonces(): Promise<Annonce[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";
  try {
    const res = await fetch(`${apiUrl}/search/annonces?limit=8&status=ACTIVE`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json() as { data: SearchPaginatedResponse<Annonce> };
    return body.data?.data ?? [];
  } catch {
    return [];
  }
}

/* ── Mock annonces for visual placeholder ────────────────── */
const MOCK_ANNONCES: Annonce[] = [
  {
    id: "1", title: "iPhone 14 Pro Max 256Go – comme neuf", price: 650000,
    type: "SALE", condition: "LIKE_NEW", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "phones", description: "",
    seller: { id: "s1", name: "Mahamat Ali", phoneNumber: "+23566123456", roles: ["SELLER"], isKycVerified: true, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: "",
  },
  {
    id: "2", title: "Toyota Land Cruiser 2018 – essence", price: 22000000,
    type: "SALE", condition: "GOOD", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "vehicles", description: "",
    seller: { id: "s2", name: "Oumar Djimet", phoneNumber: "+23568000000", roles: ["SELLER"], isKycVerified: false, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: "",
  },
  {
    id: "3", title: "Laptop HP EliteBook 840 G6 i7", price: 450000,
    type: "SALE", condition: "GOOD", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "electronics", description: "",
    seller: { id: "s3", name: "Fatima Hassan", phoneNumber: "+23565000000", roles: ["SELLER"], isKycVerified: true, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 10800000).toISOString(), expiresAt: "",
  },
  {
    id: "4", title: "Studio meublé à louer – Quartier Ambassatna", price: 120000,
    type: "SERVICE", condition: "NEW", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "realestate", description: "",
    seller: { id: "s4", name: "Abakar Saleh", phoneNumber: "+23567000000", roles: ["SELLER"], isKycVerified: false, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 18000000).toISOString(), expiresAt: "",
  },
  {
    id: "5", title: "Samsung Galaxy A54 5G – neuf sous blister", price: 195000,
    type: "SALE", condition: "NEW", status: "ACTIVE", city: "Moundou",
    images: [], categoryId: "phones", description: "",
    seller: { id: "s5", name: "Nadjita Mbodou", phoneNumber: "+23569000000", roles: ["SELLER"], isKycVerified: true, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: "",
  },
  {
    id: "6", title: "Groupe électrogène 5KVA – bon état", price: 380000,
    type: "SALE", condition: "GOOD", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "electronics", description: "",
    seller: { id: "s6", name: "Ibrahim Koné", phoneNumber: "+23562000000", roles: ["SELLER"], isKycVerified: false, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 172800000).toISOString(), expiresAt: "",
  },
  {
    id: "7", title: "Ensemble canapé salon 7 places – tissu", price: 280000,
    type: "SALE", condition: "LIKE_NEW", status: "ACTIVE", city: "Sarh",
    images: [], categoryId: "home", description: "",
    seller: { id: "s7", name: "Hadja Zara", phoneNumber: "+23564000000", roles: ["SELLER"], isKycVerified: true, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 259200000).toISOString(), expiresAt: "",
  },
  {
    id: "8", title: "Plomberie – Installation & réparation", price: 15000,
    type: "SERVICE", condition: "NEW", status: "ACTIVE", city: "N'Djamena",
    images: [], categoryId: "services", description: "",
    seller: { id: "s8", name: "Joseph Ngarta", phoneNumber: "+23561000000", roles: ["SELLER"], isKycVerified: false, createdAt: "2025-01-01" },
    createdAt: new Date(Date.now() - 345600000).toISOString(), expiresAt: "",
  },
];

export default async function HomePage() {
  const apiAnnonces = await getRecentAnnonces();
  const annonces = apiAnnonces.length > 0 ? apiAnnonces : MOCK_ANNONCES;
  const isLive = apiAnnonces.length > 0;

  return (
    <div className="flex flex-col">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 sm:py-24"
        style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/90 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-soft" />
            {isLive ? "Annonces en temps réel" : "La marketplace du Tchad"}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Achetez et vendez
            <br />
            <span className="text-accent-300">en toute confiance</span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-xl mx-auto">
            Des milliers d&apos;annonces à N&apos;Djamena et partout au Tchad.
            Paiement sécurisé Mobile Money.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar size="lg" />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
            {[
              { icon: Tag, label: "10 000+ annonces" },
              { icon: Shield, label: "Paiement sécurisé" },
              { icon: Smartphone, label: "Airtel & Moov" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/80 text-sm">
                <Icon className="w-4 h-4 text-accent-300" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Parcourir par catégorie</h2>
          <Link href="/search" className="text-sm text-brand hover:underline flex items-center gap-1">
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?categoryId=${cat.id}`}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-white hover:border-brand hover:shadow-md transition-all duration-200 text-center"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cat.color} group-hover:scale-110 transition-transform duration-200`}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-text-secondary group-hover:text-brand transition-colors leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent listings ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary">Annonces récentes</h2>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs text-success bg-success-light px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
                En direct
              </span>
            )}
            {!isLive && (
              <span className="text-xs text-text-disabled bg-border px-2.5 py-1 rounded-full">
                Exemples
              </span>
            )}
          </div>
          <Link href="/search" className="text-sm text-brand hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {annonces.map((a) => (
            <AnnonceCard key={a.id} annonce={a} />
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="bg-primary-50 border-y border-primary-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand uppercase tracking-wide">Simple & rapide</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Comment ça fonctionne ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-primary-200" />

            {[
              { step: "1", icon: "📸", title: "Publiez gratuitement", desc: "Prenez une photo, ajoutez un prix et publiez en moins de 2 minutes." },
              { step: "2", icon: "💬", title: "Discutez & négociez", desc: "Échangez directement avec les acheteurs via la messagerie intégrée." },
              { step: "3", icon: "💰", title: "Payez en sécurité", desc: "Finalisez la transaction par Mobile Money avec escrow automatique." },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-primary-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl">
                  {item.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-text-primary">{item.title}</h3>
                <p className="text-sm text-text-secondary text-center leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: stats */}
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand uppercase tracking-wide">Pourquoi Soukify</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
                La plateforme de confiance du Tchad
              </h2>
              <p className="text-text-secondary">
                Soukify met en place des mécanismes de sécurité avancés pour protéger chaque transaction.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "10 000+", label: "Annonces actives", icon: TrendingUp },
                { value: "5 000+", label: "Utilisateurs vérifiés", icon: CheckCircle },
                { value: "100%", label: "Paiements sécurisés", icon: Shield },
                { value: "2 min", label: "Pour publier", icon: Smartphone },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="p-4 rounded-2xl bg-primary-50 border border-primary-100 space-y-2">
                  <Icon className="w-5 h-5 text-brand" />
                  <p className="text-2xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-secondary">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: trust cards */}
          <div className="space-y-4">
            {[
              {
                icon: "🔐",
                title: "Escrow sécurisé",
                desc: "Votre argent est conservé en sécurité jusqu'à la confirmation de réception. Zéro risque de fraude.",
              },
              {
                icon: "✅",
                title: "Vendeurs vérifiés (KYC)",
                desc: "Les vendeurs peuvent vérifier leur identité pour renforcer la confiance des acheteurs.",
              },
              {
                icon: "📱",
                title: "Mobile Money (Airtel & Moov)",
                desc: "Payez directement depuis votre téléphone. Pas de carte bancaire requise.",
              },
              {
                icon: "⚖️",
                title: "Résolution de litiges",
                desc: "Notre équipe support intervient rapidement en cas de problème sur une commande.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-4 rounded-2xl bg-white border border-border hover:border-brand hover:shadow-sm transition-all duration-200">
                <div className="text-2xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{item.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section className="mx-4 sm:mx-6 mb-12 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Prêt à vendre ?
            </h2>
            <p className="text-white/75">
              Publiez votre première annonce gratuitement en 2 minutes.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/register">
              <Button
                variant="gold"
                size="lg"
                className="shadow-lg"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
