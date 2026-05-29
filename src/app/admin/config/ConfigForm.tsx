"use client";

import { useState, useTransition } from "react";
import { updateConfig } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle, Check } from "lucide-react";
import type { PlatformConfig } from "@/types/api";

interface ConfigFormProps {
  config: PlatformConfig;
}

type FormState = {
  commissionRatePct: number;
  freeMaxAnnonces: number;
  standardMaxAnnonces: number;
  premiumMaxAnnonces: number;
};

function validate(form: FormState): string | null {
  if (form.commissionRatePct < 0 || form.commissionRatePct > 50)
    return "La commission doit être entre 0 et 50 %.";
  if (form.freeMaxAnnonces < 1)
    return "La limite gratuit doit être ≥ 1.";
  if (form.standardMaxAnnonces <= form.freeMaxAnnonces)
    return "La limite Standard doit être supérieure à la limite Gratuit.";
  if (form.premiumMaxAnnonces <= form.standardMaxAnnonces)
    return "La limite Premium doit être supérieure à la limite Standard.";
  return null;
}

export function ConfigForm({ config }: ConfigFormProps) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    commissionRatePct:   config.commissionRatePct,
    freeMaxAnnonces:     config.freeMaxAnnonces,
    standardMaxAnnonces: config.standardMaxAnnonces,
    premiumMaxAnnonces:  config.premiumMaxAnnonces,
  });

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
    setSaved(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form);
    if (err) { setError(err); return; }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateConfig(form);
        setSaved(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde.");
      }
    });
  }

  const inputCls = "w-full h-11 px-4 rounded-xl border border-border bg-white text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Commission */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Commission plateforme</h3>
            <p className="text-xs text-text-secondary mt-0.5">Prélevée sur chaque commande complétée</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand">{form.commissionRatePct}%</p>
            <p className="text-xs text-text-disabled">Taux actuel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0} max={30} step={0.5}
            value={form.commissionRatePct}
            onChange={(e) => set("commissionRatePct", e.target.value)}
            className="flex-1 accent-brand"
          />
          <div className="w-24">
            <Input
              type="number"
              min={0} max={50} step={0.1}
              value={form.commissionRatePct}
              onChange={(e) => set("commissionRatePct", e.target.value)}
              className="text-center"
            />
          </div>
        </div>
        <p className="text-xs text-text-disabled">
          Sur une commande de 100 000 XAF → commission de{" "}
          <span className="font-semibold text-brand">{formatXAF(100000 * form.commissionRatePct / 100)}</span>
        </p>
      </div>

      {/* Annonce limits */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary">Limites d'annonces par plan</h3>
          <p className="text-xs text-text-secondary mt-0.5">Nombre maximum d'annonces actives simultanées</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "freeMaxAnnonces"     as const, label: "Plan Gratuit",  color: "border-border" },
            { key: "standardMaxAnnonces" as const, label: "Plan Standard", color: "border-brand" },
            { key: "premiumMaxAnnonces"  as const, label: "Plan Premium",  color: "border-gold" },
          ].map(({ key, label, color }) => (
            <div key={key} className={`space-y-2 p-4 rounded-xl border-2 ${color}`}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
              <input
                type="number"
                min={1}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {/* Hierarchy check */}
        <div className="flex gap-4 text-xs">
          {[
            { ok: form.standardMaxAnnonces > form.freeMaxAnnonces, label: "Standard > Gratuit" },
            { ok: form.premiumMaxAnnonces > form.standardMaxAnnonces, label: "Premium > Standard" },
          ].map(({ ok, label }) => (
            <span key={label} className={`flex items-center gap-1 font-medium ${ok ? "text-success" : "text-error"}`}>
              {ok ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Error / success */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-light border border-error">
          <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" loading={pending}>
          Enregistrer la configuration
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success font-medium">
            <Check className="w-4 h-4" /> Configuration appliquée
          </span>
        )}
      </div>
    </form>
  );
}

function formatXAF(amount: number): string {
  return new Intl.NumberFormat("fr-TD", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(amount);
}
