"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ChevronLeft, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { CHAD_CITIES, ANNONCE_CONDITIONS, CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "@/lib/constants";
import { createAnnonce } from "../../actions";
import type { Category } from "@/types/api";

const schema = z.object({
  title:       z.string().min(5, "Minimum 5 caractères").max(100),
  description: z.string().min(10, "Minimum 10 caractères").max(2000),
  categoryId:  z.string().min(1, "Choisissez une catégorie"),
  type:        z.enum(["SALE", "SERVICE"]),
  condition:   z.string().optional(),
  price:       z.string().min(1, "Requis"),
  negotiable:  z.boolean(),
  city:        z.string().min(1, "Choisissez une ville"),
});

type FormData = z.infer<typeof schema>;

interface NewAnnonceFormProps {
  categories: Category[];
  /** Links the annonce to a Pro shop (caller must be an active member) — optional, cf. HANDOFF_INFRA.md, 2026-07-26. */
  shopId?: string;
}

export function NewAnnonceForm({ categories, shopId }: NewAnnonceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, control, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "SALE", condition: "GOOD", negotiable: false },
  });

  const type = watch("type");

  /**
   * `CreateAnnonceDto` requires `priceXAF` (not `price`) and `negotiable`
   * (never sent before) — every submission through this form 400'd until
   * this fix (cf. HANDOFF_INFRA.md, 2026-07-26).
   *
   * No "publish immediately" option: `POST /annonces/:id/publish` rejects
   * an annonce with no photo ("Au moins une photo est requise..."), and
   * this form never collects one (photos are added on the annonce's own
   * management page after creation) — a "Publier maintenant" button here
   * could never actually succeed. Redirect straight to that management
   * page instead, where the next step (add a photo, then publish) is
   * right there (cf. HANDOFF_INFRA.md, 2026-07-27).
   */
  const submitForm = handleSubmit((data: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createAnnonce({
        title:       data.title,
        description: data.description,
        categoryId:  data.categoryId,
        type:        data.type,
        condition:   data.type === "SERVICE" ? "NEW" : (data.condition ?? "GOOD"),
        priceXAF:    Number(data.price),
        negotiable:  data.negotiable,
        city:        data.city,
        shopId,
      });
      if (result.ok) router.push(`/dashboard/annonces/${result.data.id}`);
      else setError(result.message);
    });
  });

  const field = "w-full h-11 px-4 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/annonces"
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Nouvelle annonce</h2>
          <p className="text-sm text-text-secondary">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-error-light border border-error">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-error">{error}</p>
            {/* POST /annonces and /annonces/:id/publish 403 with this exact wording without an approved KYC (cf. HANDOFF_INFRA.md, 2026-07-26). */}
            {error.toLowerCase().includes("kyc") && (
              <Link href="/dashboard/profile" className="text-sm font-medium text-error hover:underline">
                Vérifier mon identité →
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submitForm} className="bg-white rounded-2xl border border-border divide-y divide-border">

        {/* Type */}
        <div className="p-5 space-y-3">
          <label className="text-sm font-semibold text-text-primary">Type d&apos;annonce</label>
          <Controller
            name="type"
            control={control}
            render={({ field: f }) => (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "SALE",    icon: "📦", label: "Vente", desc: "Objet ou produit" },
                  { v: "SERVICE", icon: "🔧", label: "Service", desc: "Prestation ou compétence" },
                ].map(({ v, icon, label, desc }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => f.onChange(v)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      f.value === v
                        ? "border-brand bg-primary-50"
                        : "border-border hover:border-brand/50"
                    )}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className={cn("text-sm font-semibold", f.value === v ? "text-brand" : "text-text-primary")}>{label}</p>
                      <p className="text-xs text-text-disabled">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Infos principales */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Informations principales</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Titre *</label>
            <Input
              {...register("title")}
              placeholder="Ex: iPhone 14 Pro 256Go – comme neuf"
            />
            {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Catégorie *</label>
            <select {...register("categoryId")} className={field}>
              <option value="">Choisir une catégorie…</option>
              {categories.map((c) => {
                const style = CATEGORY_STYLE[c.slug] ?? DEFAULT_CATEGORY_STYLE;
                return (
                  <option key={c.id} value={c.id}>{c.icon ?? style.icon} {c.name}</option>
                );
              })}
            </select>
            {errors.categoryId && <p className="text-xs text-error">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Description *</label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Décrivez votre article : état, caractéristiques, raison de la vente…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors resize-none"
            />
            {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
          </div>
        </div>

        {/* Prix & état */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Prix & état</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Prix (XAF) *</label>
              <Input
                {...register("price")}
                type="number"
                min={0}
                placeholder="Ex: 150000"
              />
              {errors.price && <p className="text-xs text-error">{errors.price.message}</p>}
              <label className="flex items-center gap-2 text-xs text-text-secondary pt-1">
                <input type="checkbox" {...register("negotiable")} className="rounded border-border accent-brand" />
                Prix négociable
              </label>
            </div>

            {type === "SALE" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">État *</label>
                <select {...register("condition")} className={field}>
                  {Object.entries(ANNONCE_CONDITIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Localisation */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold text-text-primary">Localisation</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Ville *</label>
            <select {...register("city")} className={field}>
              <option value="">Choisir une ville…</option>
              {CHAD_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p className="text-xs text-error">{errors.city.message}</p>}
          </div>
        </div>

        {/* Images note */}
        <div className="p-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
            <Package className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Ajoutez au moins une photo depuis la page de gestion de votre annonce pour pouvoir la publier — une annonce sans photo ne peut pas être mise en ligne.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5">
          <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
            Créer l&apos;annonce
          </Button>
        </div>
      </form>
    </div>
  );
}
