"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CHAD_CITIES } from "@/lib/constants";
import { createShop } from "../actions";

function slugify(value: string): string {
  return value
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function CreateShopForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || slug.trim().length < 3 || !city) return;
    setError(null);
    startTransition(async () => {
      const result = await createShop({
        name: name.trim(),
        slug: slug.trim(),
        city,
        description: description.trim() || undefined,
      });
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center mx-auto">
          <Store className="w-8 h-8 text-gold" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Créez votre boutique Pro</h2>
          <p className="text-sm text-text-secondary">
            Soumettez une demande. Notre équipe l&apos;examine sous 24–48h.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 gap-2 text-left pt-2">
          {[
            { icon: "📦", label: "Jusqu'à 1000 annonces simultanées" },
            { icon: "👥", label: "Gestion d'équipe (managers, staff)" },
            { icon: "📊", label: "Statistiques avancées boutique" },
            { icon: "📋", label: "Import CSV en masse (plans STANDARD+)" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-50">
              <span>{icon}</span>
              <span className="text-sm text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <p className="font-semibold text-text-primary">Informations de votre boutique</p>

        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error-light border border-error">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nom de la boutique *</label>
          <Input
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (!slugTouched) setSlug(slugify(v));
            }}
            placeholder="Ex: Électronique Mahamat"
            required
            minLength={3}
            maxLength={60}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Identifiant boutique (URL) *</label>
          <Input
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            placeholder="electronique-mahamat"
            required
            minLength={3}
            maxLength={50}
          />
          <p className="text-xs text-text-disabled">Généré automatiquement à partir du nom, modifiable.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Ville *</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-xl border border-border bg-white text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors"
          >
            <option value="">Choisir une ville…</option>
            {CHAD_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Décrivez vos produits ou services…"
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-none transition-colors"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending}
          disabled={!name.trim() || slug.trim().length < 3 || !city}>
          Soumettre la demande
        </Button>

        <div className="flex items-center gap-2 text-xs text-text-disabled justify-center">
          <Clock className="w-3.5 h-3.5" />
          Délai d&apos;examen : 24–48 heures ouvrées
        </div>
      </form>
    </div>
  );
}
